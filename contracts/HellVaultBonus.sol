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

contract HellVaultBonus is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using HellishTransfers for address;
    using HellishTransfers for address payable;
    address public _hellVaultAddress;
    uint _totalVaultRewards;
    // A maximum of 10 bonus rewards can be available at once.
    uint[10] _currentBonusIds;
    struct BonusInfo {
        uint id;
        address tokenAddress;
        uint totalAmount;
        uint rewardPerBlock;
        //
        uint amountAvailable;
        uint startingBlock;
        uint endingBlock;
    }

    mapping (uint => BonusInfo) public _bonusInfo;
    // rewardId => userAddress => lastDividend
    mapping (uint => mapping(address => uint)) public _userBonusLastDividend;
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}
    function initialize(address hellVaultAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _hellVaultAddress = hellVaultAddress;
    }
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _addBonus(address tokenAddress, uint amount, uint rewardPerBlock, uint8 setOnIndex) external onlyOwner {
        // AB1: Must be able to provide at least 1000 dividends
        require(amount > rewardPerBlock && (amount / rewardPerBlock) > 1000, "AB1");
        // safeDepositAsset: Validates for enough: balance, allowance and if the HellVaultRewards Contract received the expected amount
        address(this).safeDepositAsset(address(tokenAddress), amount);
        BonusInfo memory bonusInfo;
        _totalVaultRewards += 1;
        bonusInfo.id = _totalVaultRewards;
        bonusInfo.tokenAddress = tokenAddress;
        bonusInfo.totalAmount = amount;
        bonusInfo.amountAvailable = amount;
        bonusInfo.rewardPerBlock = rewardPerBlock;
        // Save Bonus information
        _bonusInfo[bonusInfo.id] = bonusInfo;
        if (setOnIndex != 0) {
            _updateCurrentBonusId(setOnIndex, bonusInfo.id);
        }
    }

    function _updateCurrentBonusId(uint8 index, uint rewardId) public onlyOwner {
        require(_bonusInfo[rewardId].id != 0, "The reward Id doesn't exists");
        _currentBonusIds[index] = rewardId;
        _bonusInfo[rewardId].startingBlock = block.number;
    }

    function _setHellVaultAddress(address newHellVaultAddress) external onlyOwner {
        require(newHellVaultAddress != address (0), "The Hell Vault address cannot be the zero address");
        _hellVaultAddress = newHellVaultAddress;
        emit HellVaultAddressUpdated(newHellVaultAddress);
    }

    ////////////////////////////////////////////////////////////////////
    // Hell Vault Only                                              ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyHellVault {
        require(msg.sender == _hellVaultAddress, "Only the Hell Vault might trigger this function");
        _;
    }
    function _distributeBonuses(
        address userAddress,
        uint userLastVaultDividendBlock,
        uint stakeToReward
    ) external onlyHellVault {
        for(uint i = 0; i < _currentBonusIds.length; i++) {
            BonusInfo storage bonus = _bonusInfo[_currentBonusIds[i]];
            // If there is a Vault reward present on this index and it still has rewards available for sharing
            if(bonus.id != 0 && bonus.amountAvailable > 0) {
                uint blocksEarned;
                // If this is the first time the user gets this reward
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
                // Update the user lastDividendBlock with the latest one
                _userBonusLastDividend[bonus.id][userAddress] = block.number;
                if (blocksEarned > 0) {
                    uint userRealizedRewards = (stakeToReward * blocksEarned) * bonus.rewardPerBlock;
                    // Check if the reward.amountAvailable is not enough to pay the userRealizedRewards
                    if (bonus.amountAvailable < userRealizedRewards) {
                        // If it isn't enough we'll give the user what we have available
                        userRealizedRewards = bonus.amountAvailable;
                    }
                    bonus.amountAvailable -= userRealizedRewards;
                    // if there aren't more rewards available to share
                    if (bonus.amountAvailable == 0) {
                        // Save the bonus ending block
                        bonus.endingBlock = block.number;
                        emit BonusEnded(bonus.id);
                    }
                    // Send the user his rewards
                    payable(userAddress).safeTransferAsset(bonus.tokenAddress, userRealizedRewards);
                    emit BonusReceived(userAddress, bonus.tokenAddress, userRealizedRewards);
                }
            }
        }
    }

    ////////////////////////////////////////////////////////////////////
    // Public Functions                                             ////
    ////////////////////////////////////////////////////////////////////

    function getCurrentBonuses() public view returns (BonusInfo[] memory) {
        BonusInfo[] memory rewards = new BonusInfo[](_currentBonusIds.length);
        for(uint i = 0; i < _currentBonusIds.length; i++) {
            rewards[i] = _bonusInfo[_currentBonusIds[i]];
        }
        return rewards;
    }

    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event BonusesUpdated(uint[6] rewardIds);
    event BonusReceived(address userAddress, address tokenAddress, uint amount);
    event BonusEnded(uint bonusId);
    event HellVaultAddressUpdated(address newHellVaultAddress);
}
