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
    uint public _totalBonuses;
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
    // bonusId => BonusInfo
    mapping (uint => BonusInfo) public _bonusInfo;
    // rewardId => userAddress => lastDividend
    mapping (uint => mapping(address => uint)) public _userBonusLastDividend;
    // index => bonusId
    mapping (uint => uint) private _currentBonusIds;
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
        BonusInfo[] memory bonuses = new BonusInfo[](_maximumBonuses());
        for(uint8 i = 0; i < _maximumBonuses(); i++) {
            bonuses[i] = _bonusInfo[_currentBonusIds[i]];
            bonuses[i].userUnrealizedRewards = getUserCurrentBonusUnrealizedReward(msg.sender, i);
        }
        return bonuses;
    }

    function _minimumDividendsPerReward() public pure returns(uint) {
        return 1000;
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

    function _maximumBonuses() internal pure returns(uint) {
        return 10;
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

    function _createBonus(address tokenAddress, uint amount, uint rewardPerBlock) external onlyOwner {
        // CB1: The amount and rewardPerBlock cannot be zero
        require(amount > 0 && rewardPerBlock > 0, "CB1");
        // CB2: Must be able to provide the _minimumDividendsPerReward
        require(amount > rewardPerBlock && (amount / rewardPerBlock) > _minimumDividendsPerReward(), "CB2");
        // safeDepositAsset: Validates for enough: balance, allowance and if the HellVaultRewards Contract received the expected amount
        address(this).safeDepositAsset(address(tokenAddress), amount);
        BonusInfo memory bonusInfo;
        _totalBonuses += 1;
        bonusInfo.id = _totalBonuses;
        bonusInfo.tokenAddress = tokenAddress;
        bonusInfo.totalAmount = amount;
        bonusInfo.amountAvailable = amount;
        bonusInfo.rewardPerBlock = rewardPerBlock;
        // Set the bonus as ended until manually started.
        bonusInfo.endedAtBlock = block.number;
        // Save Bonus information
        _bonusInfo[bonusInfo.id] = bonusInfo;
        emit BonusCreated(bonusInfo.id, bonusInfo.tokenAddress, bonusInfo.amountAvailable, bonusInfo.rewardPerBlock);
    }

    function _startBonus(uint8 index, uint bonusId) public onlyOwner {
        // SB1: "The reward Id doesn't exists"
        require(_bonusInfo[bonusId].id != 0, "SB1");
        // SB2: "No rewards available"
        require(_bonusInfo[bonusId].amountAvailable > 0, "SB2");
        // SB3: "Index outside scope"
        require(index < _maximumBonuses(), "SB3");
        _currentBonusIds[index] = bonusId;
        _bonusInfo[bonusId].startingBlock = block.number;
        _bonusInfo[bonusId].endedAtBlock = 0;
        emit BonusStarted(bonusId, index);
    }

    function _setHellVaultHistoryContract(address newAddress) external onlyOwner {
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
        for(uint i = 0; i < _maximumBonuses(); i++) {
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
    event BonusCreated(uint indexed bonusId, address indexed tokenAddress, uint amountAvailable, uint rewardPerBlock);
    event BonusStarted(uint indexed bonusId, uint indexed index);
    event BonusReceived(uint indexed bonusId, uint blocksEarned, address indexed userAddress, address indexed tokenAddress, uint amount);
    event BonusEnded(uint bonusId);
    event HellVaultHistoryContractUpdated(address newAddress);
}
