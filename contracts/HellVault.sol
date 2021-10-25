// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./abstract/IHell.sol";
import "./abstract/HellGoverned.sol";
import "./libraries/HellishTransfers.sol";

contract HellVault is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, HellGoverned {
    using HellishTransfers for address;
    using HellishTransfers for address payable;
    IHell private _hellContract;
    ////////////////////////////////////////////////////////////////////
    // Dividends                                                    ////
    ////////////////////////////////////////////////////////////////////
    struct DividendPeriod {
        uint from;
        uint to;
        uint rewardPerBlock;
    }
    // Last block were a dividend was given
    uint public _lastDividendBlock;
    // Available Dividend Periods
    DividendPeriod[] public _dividendPeriods;
    // Number of blocks rewarded overall periods
    uint[] private _distributedDividends;
    // Total Amount deposited without considering user pending rewards
    uint public _totalAmountDeposited;
    ////////////////////////////////////////////////////////////////////
    // User Variables                                               ////
    ////////////////////////////////////////////////////////////////////
    struct UserInfo {
        uint hellDeposited; // The Amount of Hell that the user Staked inside the HellVault
        uint lastDividendBlock; // Last block since the user claimed his rewards
        uint[] distributedDividendsSinceLastPayment; // Dividends data since the last deposit
        ClaimMode claimMode; // If the user wishes to compound or send his rewards to his wallet
        // Used on responses only
        uint hellRewarded;
        uint hellRewardWithdrawFee;
    }
    mapping(address => UserInfo) internal _userInfo;
    ////////////////////////////////////////////////////////////////////
    // Public and external functions                                ////
    ////////////////////////////////////////////////////////////////////
    /*
     Deposits the defined amount of HELL tokens on the Hell Vault and updates the user claimMode
     @param amount: The amount the user wishes to deposit
     @param claimMode: updates the user claimMode so external compounder may continue using it on behalf of the user
    */
    function deposit(uint amount, ClaimMode claimMode) external payable nonReentrant {
        // D1: Deposit must be >= 1e12 (0.000001) HELL
        require(amount >= 1e12, "D1");
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        // Update user claimMode
        _userInfo[msg.sender].claimMode = claimMode;
        // Claim user pending rewards, avoiding the usage of an additional transaction.
        // Since the user is performing a deposit, we'll deposit his rewards back in the vault.
        _claimRewards(msg.sender, ClaimMode.SendToVault);
        // Transfer the user funds to the Hell Vault Contract
        // safeDepositAsset: Validates for enough: balance, allowance and if the HellVault Contract received the expected amount
        address(this).safeDepositAsset(address(_hellContract), amount);
        // Update deposited amounts
        _userInfo[msg.sender].hellDeposited += amount;
        _totalAmountDeposited += amount;
        emit Deposit(msg.sender, amount);
    }

    /*
     Withdraws the defined amount of HELL tokens from the Hell Vault and updates the user claimMode
     @param amount: The amount the user wishes to withdraw
    */
    function withdraw(uint amount) public nonReentrant {
        // W1: You're trying to withdraw more HELL than what you have available
        require(_userInfo[msg.sender].hellDeposited >= amount, "W1");
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        // Claim user pending rewards, avoiding the usage of an additional transaction.
        // Since the user is performing a withdraw, we'll send his rewards to his wallet.
        _claimRewards(msg.sender, ClaimMode.SendToWallet);
        // Update withdrawn amounts
        _userInfo[msg.sender].hellDeposited -= amount;
        _totalAmountDeposited -= amount;
        // Send the user his funds back
        payable(msg.sender).safeTransferAsset(address(_hellContract), amount);
        emit Withdraw(msg.sender, amount);
    }

    enum ClaimMode {
        SendToVault,
        SendToWallet
    }

    /*
     Claim pending rewards of the provided userAddress in return of a slice of the
     treasury fees associated with the transaction which are defined on the HellGovernment Contract
     as the _hellVaultCompounderFee.
     @param userAddress: The user from whom the rewards will be claimed
     @param claimMode: If the userAddress and the msg.sender are the same
            the user might use a different claimMode for this operation,
            otherwise this param can be set to zero.
    */
    function claimRewards(address userAddress, ClaimMode claimMode) external nonReentrant {
        if (getUserRewards(userAddress, 0) > 0) {
            // Update the vault, Making all unrealized rewards realized.
            _updateVault();
            if (userAddress == msg.sender) {
                // Claim user realized rewards using the request claimMode
                _claimRewards(userAddress, claimMode);
            } else {
                // Claim user realized rewards using his preferred claimMode
                _claimRewards(userAddress, _userInfo[userAddress].claimMode);
            }
        } else {
            // CR1: No rewards available to claim
            revert("CR1");
        }
    }

    function updateClaimMode(ClaimMode claimMode) external nonReentrant {
        _userInfo[msg.sender].claimMode = claimMode;
    }

    ////////////////////////////////////////////////////////////////////
    // Views                                                        ////
    ////////////////////////////////////////////////////////////////////
    function getDividendPeriodIndex() public view returns (PeriodIndexStatus, uint) {
        uint wholeNumberCurrentSupply = (_hellContract.totalSupply() / 1e18);

        // Check if Higher than last period "to" value
        if(_dividendPeriods[_dividendPeriods.length - 1].to < wholeNumberCurrentSupply) {
            return (PeriodIndexStatus.HigherThanLastToPeriod, 0);
        }

        // Find the period Index
        for(uint i = 0; i < _dividendPeriods.length; i++) {
            if((_dividendPeriods[i].from <= wholeNumberCurrentSupply) &&
                (wholeNumberCurrentSupply <= _dividendPeriods[i].to )) {
                return (PeriodIndexStatus.WithinRange, i);
            }
        }
        // Index not found
        return (PeriodIndexStatus.UndefinedIndex, 0);
    }

    function getDistributedDividends() public view returns(uint[] memory) {
        return _distributedDividends;
    }

    function getDividendPeriods() public view returns(DividendPeriod[] memory) {
        return _dividendPeriods;
    }

    /*
     Returns the realized and unrealized rewards for the provided userAddress
     measured in HELL
     @param userAddress: public wallet address of the user
     @param offset: Show users rewards in the future by adding additional blocks.
     @return totalRewards: Amount the user will receive before fees
    */
    function getUserRewards(address userAddress, uint offset) public view returns(uint totalRewards) {
        UserInfo storage user = _userInfo[userAddress];
        // If the user doesn't have anything deposited
        if (user.distributedDividendsSinceLastPayment.length == 0 || user.lastDividendBlock == 0) {
            return 0;
        }
        uint blockNumber = block.number + offset;
        // If not enough blocks have passed
        if(blockNumber <= user.lastDividendBlock) {
            return 0;
        }

        uint stakeToReward = user.hellDeposited / 1e12;
        // If user doesn't have enough staked funds
        if(stakeToReward == 0) {
            return 0;
        }

        // Calculate Realized Rewards
        uint realizedRewards = 0;
        for(uint i = 0; i < _distributedDividends.length; i++) {
            if (_distributedDividends[i] > user.distributedDividendsSinceLastPayment[i]) {
                uint blocksEarned = _distributedDividends[i] - user.distributedDividendsSinceLastPayment[i];
                if(blocksEarned > 0) {
                    // Calculate the realized interest.
                    realizedRewards += (stakeToReward * blocksEarned) * _dividendPeriods[i].rewardPerBlock;
                }
            }
        }
        totalRewards += realizedRewards;

        // Calculate unrealized Rewards, which are the ones from this period
        (, uint periodIndex) = getDividendPeriodIndex();
        uint unrealizedRewards = 0;
        DividendPeriod storage currentDividendPeriod = _dividendPeriods[periodIndex];
        uint elapsedBlocks = blockNumber - _lastDividendBlock;
        if(elapsedBlocks > 0) {
            // Calculate the unrealized interest.
            unrealizedRewards = (stakeToReward * elapsedBlocks) * currentDividendPeriod.rewardPerBlock;
        }
        totalRewards += unrealizedRewards;

        return totalRewards;
    }

    function getUserInfo(address userAddress) public view returns (UserInfo memory) {
        UserInfo memory user = _userInfo[userAddress];
        user.hellRewarded = getUserRewards(userAddress, 0);
        user.hellRewardWithdrawFee = user.hellRewarded / uint(_hellGovernmentContract._hellVaultTreasuryFee());
        return user;
    }

    ////////////////////////////////////////////////////////////////////
    // Internal Functions                                           ////
    ////////////////////////////////////////////////////////////////////
    enum PeriodIndexStatus {
        WithinRange,
        HigherThanLastToPeriod,
        UndefinedIndex
    }

    function _updateVault() internal {
        // Make sure the block number is higher than the _lastDividendBlock
        if (block.number <= _lastDividendBlock) {
            return;
        }
        // Obtain the current period Index
        (PeriodIndexStatus periodIndexStatus, uint periodIndex) = getDividendPeriodIndex();
        if(periodIndexStatus == PeriodIndexStatus.UndefinedIndex) {
            revert("Undefined Period Index");
        }
        // Calculate the number of elapsedBlocks since the last dividend
        uint elapsedBlocks = block.number - _lastDividendBlock;
        _lastDividendBlock = block.number;
        // If this period provides rewards
        if (periodIndexStatus == PeriodIndexStatus.WithinRange && _dividendPeriods[periodIndex].rewardPerBlock > 0) {
            _distributedDividends[periodIndex] += elapsedBlocks;
        }
    }

    function _claimRewards(address userAddress, ClaimMode claimMode) internal {
        uint rewards = getUserRewards(userAddress, 0);
        // Reset Timestamps
        _userInfo[userAddress].lastDividendBlock = block.number;
        // Copy the current dividends Data
        _userInfo[userAddress].distributedDividendsSinceLastPayment = _distributedDividends;
        if (rewards > 0) {
            // Mint rewards
            _hellContract.mintVaultRewards(rewards);
            // Calculate treasuryFee
            uint treasuryFee = rewards / uint(_hellGovernmentContract._hellVaultTreasuryFee());
            uint compounderFee;
            // If this transaction produces treasury fees
            if (treasuryFee > 0) {
                rewards -= treasuryFee;
                // Calculate compounder fee
                compounderFee = treasuryFee / _hellGovernmentContract._hellVaultCompounderFee();
                if (compounderFee > 0) {
                    // Subtract compounderFee from the treasuryFee
                    treasuryFee -= compounderFee;
                    // If the userAddress is the msg.sender add compounding rewards back and avoid the extra transfer
                    if(msg.sender == userAddress) {
                        rewards += compounderFee;
                        compounderFee = 0;
                    } else {
                        // if the msg.sender and the userAddress are different pay compounderFee
                        payable(msg.sender).safeTransferAsset(address(_hellContract), compounderFee);
                    }
                }
                // Pay treasuryFee
                (_hellGovernmentContract._hellTreasuryAddress()).safeTransferAsset(address(_hellContract), treasuryFee);
            }
            // If user wishes to compound his rewards, send them to the vault again
            if (claimMode == ClaimMode.SendToVault) {
                // Update the amount the user has deposited
                _userInfo[userAddress].hellDeposited += rewards;
                // Update _totalAmountDeposited in the HellVault
                _totalAmountDeposited += rewards;
            }
            // If the user wishes to have his rewards sent to his wallet
            if (claimMode == ClaimMode.SendToWallet) {
                payable(userAddress).safeTransferAsset(address(_hellContract), rewards);
            }
            emit ClaimRewards(userAddress, msg.sender, claimMode, rewards, treasuryFee, compounderFee);
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}
    function initialize(address hellContractAddress, address hellGovernmentAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _lastDividendBlock = block.number;
        _hellContract = IHell(hellContractAddress);
        _setHellGovernmentContract(hellGovernmentAddress);
    }
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _setDividendPeriods(DividendPeriod[] memory dividendPeriods) public onlyOwner {
        for(uint i = 0; i < dividendPeriods.length; i++) {
            _distributedDividends.push(uint(0));
            _dividendPeriods.push(dividendPeriods[i]);
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event Deposit(address indexed user, uint amount);
    event Withdraw(address indexed user, uint amount);
    event ClaimRewards(address indexed userAddress, address indexed compounderAddress, ClaimMode claimMode, uint rewardedAmount, uint treasuryFee, uint compounderFee);
    event ReceivedTokens(address operator, address from, address to, uint amount, bytes userData, bytes operatorData);
}
