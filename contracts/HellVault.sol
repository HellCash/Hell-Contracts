// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
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
        // Used on responses only
        uint hellRewarded;
        uint hellRewardWithdrawFee;
    }
    mapping(address => UserInfo) internal _userInfo;
    ////////////////////////////////////////////////////////////////////
    // Public and external functions                                ////
    ////////////////////////////////////////////////////////////////////
    function deposit(uint amount) external payable nonReentrant {
        // D1: Deposit must be >= 1e12 (0.000001) HELL
        require(amount >= 1e12, "D1");
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        // Claim user pending rewards, avoiding the usage of an additional transaction.
        // Since the user is performing a deposit, we'll deposit his rewards back in the vault.
        _claimRewards(ClaimMode.SendToVault);
        // Transfer the user funds to the Hell Vault Contract
        // safeDepositAsset: Validates for enough: balance, allowance and if the HellVault Contract received the expected amount
        address(this).safeDepositAsset(address(_hellContract), amount);
        // Update deposited amounts
        _userInfo[msg.sender].hellDeposited += amount;
        _totalAmountDeposited += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint amount) public nonReentrant {
        // W1: You're trying to withdraw more HELL than what you have available
        require(_userInfo[msg.sender].hellDeposited >= amount, "W1");
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        // Claim user pending rewards, avoiding the usage of an additional transaction.
        // Since the user is performing a withdraw, we'll send his rewards to his wallet.
        _claimRewards(ClaimMode.SendToWallet);
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

    function claimRewards(ClaimMode claimMode) external nonReentrant {
        if (getUserRewards(msg.sender, 0) > 0) {
            _claimRewards(claimMode);
        } else {
            // CR1: No rewards available to claim
            revert("CR1");
        }
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
     @param userAddress: public wallet address of the user
     @param offset: Show users rewards in the future by adding additional blocks.
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
        // And that the _totalAmountDeposited is higher than 0
        if (block.number <= _lastDividendBlock || _totalAmountDeposited == 0) {
            return;
        }
        // Obtain the current period Index
        (PeriodIndexStatus periodIndexStatus, uint periodIndex) = getDividendPeriodIndex();
        if(periodIndexStatus == PeriodIndexStatus.UndefinedIndex) {
            revert("Undefined Period Index");
        }
        // If there are no periods left we reached the maximum and no rewards will be given.
        if(periodIndexStatus == PeriodIndexStatus.HigherThanLastToPeriod) {
            return;
        }
        // If this period doesn't provide rewards
        if (_dividendPeriods[periodIndex].rewardPerBlock == 0) {
            return;
        }

        // Calculate the number of elapsedBlocks since the last dividend
        uint elapsedBlocks = block.number - _lastDividendBlock;
        // Calculate the stakeToReward.
        uint stakeToReward = _totalAmountDeposited / 1e12;
        _lastDividendBlock = block.number;
        _distributedDividends[periodIndex] += elapsedBlocks;
        // Calculate the amount to be minted
        uint amountToMint = (stakeToReward * elapsedBlocks) * _dividendPeriods[periodIndex].rewardPerBlock;
        _hellContract.mintVaultRewards(amountToMint);
    }

    function _claimRewards(ClaimMode claimMode) internal {
        uint rewards = getUserRewards(msg.sender, 0);
        // Reset Timestamps
        _userInfo[msg.sender].lastDividendBlock = block.number;
        // Copy the current dividends Data
        _userInfo[msg.sender].distributedDividendsSinceLastPayment = _distributedDividends;
        if (rewards > 0) {
            // Calculate treasuryFee
            uint treasuryFee = rewards / uint(_hellGovernmentContract._hellVaultTreasuryFee());
            if (treasuryFee > 0) {
                rewards -= treasuryFee;
                // Pay treasuryFee
                (_hellGovernmentContract._hellTreasuryAddress()).safeTransferAsset(address(_hellContract), treasuryFee);
            }
            // If user wishes to compound his rewards, send them to the vault again
            if (claimMode == ClaimMode.SendToVault) {
                // Update the amount the user has deposited
                _userInfo[msg.sender].hellDeposited += rewards;
                // Update _totalAmountDeposited in the HellVault
                _totalAmountDeposited += rewards;
            }
            // If user wishes to have his rewards sent to his wallet
            if (claimMode == ClaimMode.SendToWallet) {
                payable(msg.sender).safeTransferAsset(address(_hellContract), rewards);
            }

            emit ClaimRewards(msg.sender, claimMode, rewards, treasuryFee);
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
        require(dividendPeriods.length <= 12, 'Dividend periods are limited to 12');
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
    event ClaimRewards(address indexed user, ClaimMode claimMode, uint rewardedAmount, uint treasuryFee);
    event ReceivedTokens(address operator, address from, address to, uint amount, bytes userData, bytes operatorData);
}
