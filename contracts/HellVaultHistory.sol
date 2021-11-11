// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./abstract/HellVaultAdministered.sol";
import "./HellVault.sol";

contract HellVaultHistory is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, HellVaultAdministered {
    ////////////////////////////////////////////////////////////////////
    // Variables                                                    ////
    ////////////////////////////////////////////////////////////////////
    address _hellVaultBonusAddress;
    struct RewardInfo {
        // Unique identifier for this operation
        uint id;
        // Cryptocurrency asset given
        address tokenAddress;
        // Amount given to the user
        uint amount;
        // Claim mode used during this transaction
        HellVault.ClaimMode claimMode;
        // Block number on which this bonus was given
        uint blockNumber;
        // Address of the user that claimed the reward on behalf of the user.
        address claimedBy;
        // Total accumulated amount of the rewarded token for the userAddress by when the reward was given
        uint cumulativeRewards;
    }
    // Total rewards indexing
    // userAddress => totalRewards
    mapping(address => uint) public _userTotalRewards;
    // userAddress => rewardIndex => RewardInfo
    // Cumulative rewards indexing
    mapping(address => mapping(uint => RewardInfo)) public _userRewards;
    // userAddress => tokenAddress => userCumulativeReward;
    mapping(address => mapping(address => uint)) public _userCumulativeRewards;
    ////////////////////////////////////////////////////////////////////
    // Public Views                                                 ////
    ////////////////////////////////////////////////////////////////////
    function getUserRewardsHistory(address userAddress, uint[] memory ids) external view returns(RewardInfo[] memory) {
        RewardInfo[] memory rewards = new RewardInfo[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            rewards[i] = _userRewards[userAddress][ids[i]];
        }
        return rewards;
    }
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address hellVaultAddress, address hellVaultBonusAddress) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _setHellVaultAddress(hellVaultAddress);
        _setHellVaultBonusAddress(hellVaultBonusAddress);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _setHellVaultBonusAddress(address newAddress) public onlyOwner {
        require(newAddress != address (0), "The Hell Vault Bonus address cannot be the zero address");
        _hellVaultBonusAddress = newAddress;
        emit HellVaultBonusAddressUpdated(newAddress);
    }
    ////////////////////////////////////////////////////////////////////
    // Only HellVault or HellVaultBonus Contracts                   ////
    ////////////////////////////////////////////////////////////////////
    modifier onlyHellVaultOrHellVaultBonus() {
        require(msg.sender == address(_hellVault) || msg.sender == _hellVaultBonusAddress, "Forbidden");
        _;
    }

    function _registerUserReward(address userAddress, address tokenAddress, uint amount, HellVault.ClaimMode claimMode) external onlyHellVaultOrHellVaultBonus {
        RewardInfo memory reward;
        _userTotalRewards[userAddress] += 1;
        reward.id = _userTotalRewards[userAddress];
        reward.tokenAddress = tokenAddress;
        reward.amount = amount;
        reward.claimMode = claimMode;
        reward.blockNumber = block.number;
        reward.claimedBy = tx.origin;
        _userCumulativeRewards[userAddress][tokenAddress] += amount;
        reward.cumulativeRewards = _userCumulativeRewards[userAddress][tokenAddress];
        _userRewards[userAddress][reward.id] = reward;
        emit RewardRegistered(reward.id, userAddress, reward.tokenAddress, reward.amount);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event HellVaultBonusAddressUpdated(address newHellVaultAddress);
    event RewardRegistered(uint indexed id, address indexed userAddress, address indexed tokenAddress, uint amount);
}
