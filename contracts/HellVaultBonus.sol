// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./libraries/HellishTransfers.sol";
import "./abstract/HellVaultAdministered.sol";
import "./HellVault.sol";
import "./HellVaultHistory.sol";

contract HellVaultBonus is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, HellVaultAdministered {
    using HellishTransfers for address;
    using HellishTransfers for address payable;
    HellVaultHistory private _hellVaultHistory;
    ////////////////////////////////////////////////////////////////////
    // Bonuses variables                                            ////
    ////////////////////////////////////////////////////////////////////
    uint private _totalVaultBonuses;
    // A maximum of 10 bonus rewards can be available at once.
    uint[10] private _currentBonusIds;
    struct BonusInfo {
        uint id;
        address tokenAddress;
        uint totalAmount;
        uint rewardPerBlock;
        //
        uint amountAvailable;
        uint startingBlock;
        uint endedAtBlock;
        // Added on responses only
        uint userUnrealizedRewards;
    }
    mapping (uint => BonusInfo) public _bonusInfo;
    // rewardId => userAddress => lastDividend
    mapping (uint => mapping(address => uint)) public _userBonusLastDividend;
    ////////////////////////////////////////////////////////////////////
    // Public Functions                                             ////
    ////////////////////////////////////////////////////////////////////
    function getUserCurrentBonusUnrealizedReward(address userAddress, uint8 currentBonusIndex) public view returns (uint) {
        uint unrealizedRewards;
        if (userAddress != address(0)) {
            // Request the hellDeposited and the lastDividendBlock from the userAddress on the HellVault
            (uint hellDeposited, uint lastDividendBlock,,,) = _hellVault._userInfo(msg.sender);
            // Calculate the userAddress unrealizedRewards
            (unrealizedRewards, ) = _calculateBonusUnrealizedRewards(_bonusInfo[_currentBonusIds[currentBonusIndex]].id, userAddress, lastDividendBlock, (hellDeposited / _hellVault._minimumDeposit()));
        }
        return unrealizedRewards;
    }

    function getCurrentBonuses() public view returns (BonusInfo[] memory) {
        BonusInfo[] memory bonuses = new BonusInfo[](_currentBonusIds.length);
        for(uint8 i = 0; i < _currentBonusIds.length; i++) {
            bonuses[i] = _bonusInfo[_currentBonusIds[i]];
            bonuses[i].userUnrealizedRewards = getUserCurrentBonusUnrealizedReward(msg.sender, i);
        }
        return bonuses;
    }
    ////////////////////////////////////////////////////////////////////
    // Internal Functions                                           ////
    ////////////////////////////////////////////////////////////////////
    function _calculateBonusUnrealizedRewards(
        uint bonusId,
        address userAddress,
        uint userLastVaultDividendBlock,
        uint stakeToReward
    ) internal view returns (uint unrealizedRewards, uint blocksEarned) {
        BonusInfo memory bonus = _bonusInfo[bonusId];
        if(stakeToReward > 0) {
            // If there is a Vault reward present on this index, it still has rewards available for sharing
            // and it hasn't ended
            if(bonus.id != 0 && bonus.endedAtBlock == 0 && bonus.amountAvailable > 0) {
                // If this is the first time the user gets this bonus
                if(_userBonusLastDividend[bonus.id][userAddress] == 0) {
                    // If the user had deposits before or on the reward.startingBlock
                    if (userLastVaultDividendBlock <= bonus.startingBlock) {
                        // Get the amount of blocks elapsed
                        blocksEarned = block.number - bonus.startingBlock;
                    }
                    // If the user made deposits after the reward.startingBlock
                    if (userLastVaultDividendBlock > bonus.startingBlock) {
                        // Get the amount of blocks elapsed
                        blocksEarned = block.number - userLastVaultDividendBlock;
                    }
                    // Else if the userRewardLastDividend was already available
                } else {
                    blocksEarned = block.number - _userBonusLastDividend[bonus.id][userAddress];
                }

                if (blocksEarned > 0) {
                    unrealizedRewards = (stakeToReward * blocksEarned) * bonus.rewardPerBlock;
                    // Check if the reward.amountAvailable is not enough to pay the userRealizedRewards
                    if (bonus.amountAvailable < unrealizedRewards) {
                        // If it isn't enough we'll give the user what we have available
                        unrealizedRewards = bonus.amountAvailable;
                    }
                }
            }
        }
        return (unrealizedRewards, blocksEarned);
    }
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address hellVaultAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _setHellVaultAddress(hellVaultAddress);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _addBonus(address tokenAddress, uint amount, uint rewardPerBlock, uint8 setOnIndex) external onlyOwner {
        // AB1: Must be able to provide at least 1000 dividends
        require(amount > rewardPerBlock && (amount / rewardPerBlock) > 1000, "AB1");
        // safeDepositAsset: Validates for enough: balance, allowance and if the HellVaultRewards Contract received the expected amount
        address(this).safeDepositAsset(address(tokenAddress), amount);
        BonusInfo memory bonusInfo;
        _totalVaultBonuses += 1;
        bonusInfo.id = _totalVaultBonuses;
        bonusInfo.tokenAddress = tokenAddress;
        bonusInfo.totalAmount = amount;
        bonusInfo.amountAvailable = amount;
        bonusInfo.rewardPerBlock = rewardPerBlock;
        // Save Bonus information
        _bonusInfo[bonusInfo.id] = bonusInfo;
        if (setOnIndex != 0) {
            _updateCurrentBonusId(setOnIndex, bonusInfo.id);
        } else {
            // If we didn't set any index for this bonus mark it as ended.
            _bonusInfo[bonusInfo.id].endedAtBlock = block.number;
        }
    }

    function _updateCurrentBonusId(uint8 index, uint rewardId) public onlyOwner {
        require(_bonusInfo[rewardId].id != 0, "The reward Id doesn't exists");
        _currentBonusIds[index] = rewardId;
        _bonusInfo[rewardId].startingBlock = block.number;
        _bonusInfo[rewardId].endedAtBlock = 0;
    }

    function _updateHellVaultHistoryContract(address newAddress) external onlyOwner {
        _hellVaultHistory = HellVaultHistory(newAddress);
        emit HellVaultHistoryContractUpdated(newAddress);
    }
    ////////////////////////////////////////////////////////////////////
    // Hell Vault Only                                              ////
    ////////////////////////////////////////////////////////////////////
    /*
     Distributes the bonuses declared on the _currentBonusIds array for the given user
     @param userAddress: Address of the user that will receive the bonuses
     @param userLastVaultDividendBlock: Block number on which the userAddress received his last dividend
            before claimingRewards on the HellVault
     @param stakeToReward: stake to be rewarded, calculated by the hellVault by
            userHellDeposited / _minimumDeposit()
    */
    function _distributeBonuses(
        address userAddress,
        uint userLastVaultDividendBlock,
        uint stakeToReward
    ) external onlyHellVault {
        for(uint i = 0; i < _currentBonusIds.length; i++) {
            // Get the current bonus by his Id
            BonusInfo storage bonus = _bonusInfo[_currentBonusIds[i]];
            // Calculate the user unrealizedRewards
            (uint unrealizedRewards, uint blocksEarned) = _calculateBonusUnrealizedRewards(bonus.id, userAddress, userLastVaultDividendBlock, stakeToReward);
            // Update the user lastDividendBlock for this bonus with the latest one
            _userBonusLastDividend[bonus.id][userAddress] = block.number;
            // If there are rewards available
            if (blocksEarned > 0 && unrealizedRewards > 0) {
                // Subtract the unrealizedRewards from the total available
                bonus.amountAvailable -= unrealizedRewards;
                // if there aren't more rewards available to share
                if (bonus.amountAvailable == 0) {
                    // Mark the bonus as ended
                    bonus.endedAtBlock = block.number;
                    emit BonusEnded(bonus.id);
                }
                // Send the user his rewards
                payable(userAddress).safeTransferAsset(bonus.tokenAddress, unrealizedRewards);
                _hellVaultHistory._registerUserReward(userAddress, bonus.tokenAddress, unrealizedRewards, HellVault.ClaimMode.SendToWallet);
                emit BonusReceived(bonus.id, blocksEarned, userAddress, bonus.tokenAddress, unrealizedRewards);
            }
        }
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event BonusReceived(uint bonusId, uint blocksEarned, address userAddress, address tokenAddress, uint amount);
    event BonusEnded(uint bonusId);
    event HellVaultHistoryContractUpdated(address newAddress);
}
