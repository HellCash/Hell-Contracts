// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.6;
pragma experimental ABIEncoderV2;

import "./interfaces/HellInterface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract HellVault is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for HellInterface;
    ////////////////////////////////////////////////////////////////////
    // Contracts, Addresses and General Variables                   ////
    ////////////////////////////////////////////////////////////////////
    HellInterface private _hellContract;
    address private _hellTreasuryAddress;
    uint8 private _hellTreasuryFee;
    ////////////////////////////////////////////////////////////////////
    // Dividend Variables                                           ////
    ////////////////////////////////////////////////////////////////////
    struct DividendPeriod {
        uint from;
        uint to;
        uint rewardPerBlock;
    }
    // Last block were a dividend was given
    uint public _lastDividendBlock;
    // Available Dividend Periods
    DividendPeriod[] private _dividendPeriods;
    // Number of blocks rewarded overall periods
    uint[] public _distributedDividends;
    // Total Amount deposited without considering user rewards
    uint public _totalAmountDeposited;
    ////////////////////////////////////////////////////////////////////
    // User Variables                                               ////
    ////////////////////////////////////////////////////////////////////
    struct UserInfo {
        uint hellDeposited; // The Amount of Hell that the user Staked inside the HellVault
        uint lastDividendBlock; // Last block since the user claimed his rewards
        uint[] distributedDividendsSinceLastPayment; // Dividends data since the last deposit
    }
    mapping(address => UserInfo) internal _userInfo;
    ////////////////////////////////////////////////////////////////////
    // Public Functions                                             ////
    ////////////////////////////////////////////////////////////////////
    function deposit(uint amount) external payable nonReentrant {
        require(_hellContract.balanceOf(msg.sender) >= amount, "You don't have enough funds");
        require(_hellContract.allowance(msg.sender, address(this)) >= amount, "You don't have enough allowance");
        require(amount >= 1e14, "Deposit must be >= 0.0001 HELL");
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        _claimRewards(ClaimMode.SendToVault);
        // Transfer the user funds to the Hell Vault Contract
        _hellContract.safeTransferFrom(msg.sender, address(this), amount);
        // Update deposited amounts
        _userInfo[msg.sender].hellDeposited += amount;
        _totalAmountDeposited += amount;

        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint amount) public nonReentrant {
        require(_userInfo[msg.sender].hellDeposited >= amount, "You are trying to withdraw more HELL than what you have available");
        _claimRewards(ClaimMode.SendToWallet);
        // Update the vault, Making all unrealized rewards realized.
        _updateVault();
        // Update withdrawn amounts
        _userInfo[msg.sender].hellDeposited -= amount;
        _totalAmountDeposited -= amount;
        // Send the user his funds back
        _hellContract.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    enum ClaimMode {
        SendToVault,
        SendToWallet
    }


    function _claimRewards(ClaimMode claimMode) internal {
        uint rewards = _calculateUserRewards(msg.sender, RewardCalculationMode.RealizedAndUnrealizedRewards);
        if (rewards > 0) {
            // Reset Timestamps
            _userInfo[msg.sender].lastDividendBlock = block.number;
            // Copy the current dividends Data
            _userInfo[msg.sender].distributedDividendsSinceLastPayment = _distributedDividends;
            // Calculate and pay treasury fees
            uint treasuryFee = _calculateTreasuryFeeOfAmount(rewards);
            if (treasuryFee > 0) {
                rewards -= treasuryFee;
                _payTreasuryFee(treasuryFee);
            }
            // If user wishes to compound his rewards, send them to the vault again
            if (claimMode == ClaimMode.SendToVault) {
                _userInfo[msg.sender].hellDeposited += rewards;
                // Update balances
                _totalAmountDeposited += rewards;
            }
            // If user wishes to have his rewards sent to his wallet
            if (claimMode == ClaimMode.SendToWallet) {
                _hellContract.safeTransfer(msg.sender, rewards);
            }

            emit ClaimRewards(msg.sender, claimMode, rewards, treasuryFee);
        }
    }

    function claimRewards(ClaimMode claimMode) public nonReentrant {
        require(_calculateUserRewards(msg.sender, RewardCalculationMode.RealizedAndUnrealizedRewards) > 0, "You don't have any reward to claim");
        _claimRewards(claimMode);
        _updateVault();
    }


    ////////////////////////////////////////////////////////////////////
    // Public Views                                                 ////
    ////////////////////////////////////////////////////////////////////
    enum PeriodIndexStatus {
        WithinRange,
        HigherThanLastToPeriod,
        UndefinedIndex
    }

    function getDividendPeriods() public view returns (DividendPeriod[] memory) {
        return _dividendPeriods;
    }

    function _dividendPeriodIndex() public view returns (PeriodIndexStatus, uint) {
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

    // Vault balance considering user balances and their realized rewards
    function getVaultHELLBalance() public view returns (uint) {
        return _hellContract.balanceOf(address(this));
    }

    struct UserInfoResponse {
        uint hellDeposited; // The Amount of Hell that the user Staked inside the HellVault
        uint lastDividendBlock; // Last block since the user claimed his rewards
        uint[] distributedDividendsSinceLastPayment; // Dividends data since the last deposit
        uint hellRewarded;
        uint hellRewardWithdrawFee;
    }

    function getUserInfo(address userAddress) public view returns (UserInfoResponse memory) {
        UserInfo storage user = _userInfo[userAddress];
        UserInfoResponse memory userInfoResponse;
        userInfoResponse.hellDeposited = user.hellDeposited;
        userInfoResponse.lastDividendBlock = user.lastDividendBlock;
        userInfoResponse.distributedDividendsSinceLastPayment = user.distributedDividendsSinceLastPayment;
        userInfoResponse.hellRewarded = _calculateUserRewards(userAddress, RewardCalculationMode.RealizedAndUnrealizedRewards);
        userInfoResponse.hellRewardWithdrawFee = _calculateTreasuryFeeOfAmount(userInfoResponse.hellRewarded);
        return userInfoResponse;
    }

    enum RewardCalculationMode {
        RealizedAndUnrealizedRewards,
        RealizedRewardsOnly,
        UnrealizedRewardsOnly
    }

    function _calculateUserRewards(address userAddress, RewardCalculationMode rewardCalculationMode) public view returns(uint) {
        UserInfo storage user = _userInfo[userAddress];
        // If the user has never deposited
        if (user.distributedDividendsSinceLastPayment.length == 0 || user.lastDividendBlock == 0) {
            return 0;
        }
        // If not enough blocks have passed
        if(block.number <= user.lastDividendBlock) {
            return 0;
        }
        uint stakeToReward = user.hellDeposited / 1e16;
        // If user doesn't have enough staked funds
        if(stakeToReward == 0) {
            return 0;
        }
        uint totalRewards = 0;
        // Calculate Realized Rewards
        if(rewardCalculationMode == RewardCalculationMode.RealizedAndUnrealizedRewards
        || rewardCalculationMode == RewardCalculationMode.RealizedRewardsOnly) {
            uint realizedRewards = 0;
            for(uint i = 0; i < _distributedDividends.length; i++) {
                if (_distributedDividends[i] > user.distributedDividendsSinceLastPayment[i]) {
                    uint blocksEarned = _distributedDividends[i] - user.distributedDividendsSinceLastPayment[i];
                    if(blocksEarned > 0) {
                        realizedRewards += (stakeToReward * blocksEarned) * _dividendPeriods[i].rewardPerBlock;
                    }
                }
            }
            totalRewards += realizedRewards;
        }

        // Calculate unrealized Rewards
        if(rewardCalculationMode == RewardCalculationMode.RealizedAndUnrealizedRewards
            || rewardCalculationMode == RewardCalculationMode.UnrealizedRewardsOnly) {
            (PeriodIndexStatus periodIndexStatus, uint periodIndex) = _dividendPeriodIndex();
            if(periodIndexStatus == PeriodIndexStatus.WithinRange) {
                uint unrealizedRewards = 0;
                DividendPeriod storage currentDividendPeriod = _dividendPeriods[periodIndex];
                uint elapsedBlocks = block.number - _lastDividendBlock;
                if(elapsedBlocks > 0) {
                    // Calculate the unrealized interest.
                    unrealizedRewards = (stakeToReward * elapsedBlocks) * currentDividendPeriod.rewardPerBlock;
                }
                totalRewards += unrealizedRewards;
            }
        }

        return totalRewards;
    }

    ////////////////////////////////////////////////////////////////////
    // Internal Functions                                           ////
    ////////////////////////////////////////////////////////////////////
    function _payTreasuryFee(uint amount) internal {
        _hellContract.safeTransfer(_hellTreasuryAddress, amount);
    }

    function _calculateTreasuryFeeOfAmount(uint amount) internal view returns (uint) {
        return uint(_hellTreasuryFee) * (amount / 100);
    }

    function _updateVault() internal {
        if (block.number <= _lastDividendBlock || _totalAmountDeposited == 0) {
            return;
        }
        (PeriodIndexStatus periodIndexStatus, uint periodIndex) = _dividendPeriodIndex();
        if(periodIndexStatus == PeriodIndexStatus.UndefinedIndex) {
            revert("Undefined Period Index");
        }
        // If there are no periods left we reached the maximum and no rewards will be given.
        if(periodIndexStatus == PeriodIndexStatus.HigherThanLastToPeriod) {
            return;
        }

        if (_dividendPeriods[periodIndex].rewardPerBlock == 0) {
            return;
        }

        uint elapsedBlocks = block.number - _lastDividendBlock;
        uint stakeToReward = _totalAmountDeposited / 1e16;
        uint amountToMint = (stakeToReward * elapsedBlocks) * _dividendPeriods[periodIndex].rewardPerBlock;
        _hellContract.mintVaultRewards(amountToMint);
        _lastDividendBlock = block.number;
        _distributedDividends[periodIndex] += elapsedBlocks;
    }

    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function initialize(address hellContractAddress, address hellTreasuryAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        _lastDividendBlock = block.number;
        _setHellContractAddress(hellContractAddress);
        _setTreasuryAddressAndFee(hellTreasuryAddress, 6);
    }

    function _setTreasuryAddressAndFee(address treasuryAddress, uint8 hellTreasuryFee) public onlyOwner {
        _hellTreasuryAddress = treasuryAddress;
        _hellTreasuryFee = hellTreasuryFee;
    }

    function _setHellContractAddress(address hellContractAddress) public onlyOwner {
        _hellContract = HellInterface(hellContractAddress);
    }

    function _setDividendPeriods(DividendPeriod[] memory dividendPeriods) public onlyOwner {
        require(dividendPeriods.length <= 12, 'Dividend periods are limited to 12');
        for(uint i = 0; i < dividendPeriods.length; i++) {
            _distributedDividends.push(uint(0));
            _dividendPeriods.push(dividendPeriods[i]);
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    ////////////////////////////////////////////////////////////////////
    // Events                                                        ////
    ////////////////////////////////////////////////////////////////////
    event Deposit(address indexed user, uint amount);
    event Withdraw(address indexed user, uint amount);
    event ClaimRewards(address indexed user, ClaimMode claimMode, uint rewardedAmount, uint treasuryFee);
    event ReceivedTokens(address operator, address from, address to, uint amount, bytes userData, bytes operatorData);
}