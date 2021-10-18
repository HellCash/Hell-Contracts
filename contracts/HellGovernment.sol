// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract HellGovernment is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    // General variables
    address payable public _hellTreasuryAddress;
    uint16 public _generalPaginationLimit;
    // Help us know if a specific token address was marked as trusted or not.
    mapping(address => bool) public _tokenIsTrusted;
    // Auction House variables
    uint16 public _auctionHouseTreasuryFee;
    uint public _minimumAuctionLength;
    uint public _maximumAuctionLength;
    // Greed Starter variables
    uint16 public _greedStarterTreasuryFee;
    uint public _minimumProjectLength;
    uint public _maximumProjectLength;
    // Hell Vault
    uint16 public _hellVaultTreasuryFee;
    uint16 public _hellVaultCompounderFee;
    ////////////////////////////////////////////////////////////////////
    // Only Owner                                                   ////
    ////////////////////////////////////////////////////////////////////
    function _authorizeUpgrade(address) internal override onlyOwner {}
    /////////////////////////////////////
    // General                      ////
    ////////////////////////////////////
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}
    function initialize(
        address payable treasuryAddress,
        uint16 auctionHouseFee,
        uint minimumAuctionLength,
        uint maximumAuctionLength,
        uint16 greedStarterFee,
        uint minimumProjectLength,
        uint maximumProjectLength,
        uint16 hellVaultTreasuryFee,
        uint16 hellVaultCompounderFee
    ) initializer public {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _generalPaginationLimit = 40;
        _setTreasuryAddress(treasuryAddress);
        // Initialize Auction House Variables
        _setAuctionHouseTreasuryFees(auctionHouseFee);
        _setMinimumAndMaximumAuctionLength(minimumAuctionLength, maximumAuctionLength);
        // Initialize Greed Starter Variables
        _setGreedStarterTreasuryFees(greedStarterFee);
        _setMinimumAndMaximumProjectLength(minimumProjectLength, maximumProjectLength);
        // Initialize Hell Vault Variables
        _setHellVaultTreasuryFee(hellVaultTreasuryFee, hellVaultCompounderFee);
        // By default the only trusted token will be the Network currency
        _tokenIsTrusted[address(0)] = true;
    }

    function _setTreasuryAddress(address payable treasuryAddress) public onlyOwner {
        _hellTreasuryAddress = treasuryAddress;
        emit TreasuryAddressUpdated(treasuryAddress);
    }

    function _setGeneralPaginationLimit(uint16 newPaginationLimit) public onlyOwner {
        _generalPaginationLimit = newPaginationLimit;
        emit GeneralPaginationLimitUpdated(newPaginationLimit);
    }

    function _setTokenTrust(address tokenAddress, bool isTrusted) external onlyOwner {
        _tokenIsTrusted[tokenAddress] = isTrusted;
        emit UpdatedTokenTrust(tokenAddress, isTrusted);
    }
    /////////////////////////////////////
    // Auction House                ////
    ////////////////////////////////////
    function _setMinimumAndMaximumAuctionLength(uint newMinimumLength, uint newMaximumLength) public onlyOwner {
        _minimumAuctionLength = newMinimumLength;
        _maximumAuctionLength = newMaximumLength;
        emit MinimumAndMaximumAuctionLengthUpdated(newMinimumLength, newMaximumLength);
    }

    function _setAuctionHouseTreasuryFees(uint16 newFee) public onlyOwner {
        _auctionHouseTreasuryFee = newFee;
        emit AuctionHouseTreasuryFeesUpdated(newFee);
    }
    /////////////////////////////////////
    // Greed Starter                ////
    ////////////////////////////////////
    function _setMinimumAndMaximumProjectLength(uint newMinimumLength, uint newMaximumLength) public onlyOwner {
        _minimumProjectLength = newMinimumLength;
        _maximumProjectLength = newMaximumLength;
        emit MinimumAndMaximumProjectLengthUpdated(newMinimumLength, newMaximumLength);
    }

    function _setGreedStarterTreasuryFees(uint16 newFee) public onlyOwner {
        _greedStarterTreasuryFee = newFee;
        emit GreedStarterTreasuryFeesUpdated(newFee);
    }
    /////////////////////////////////////
    // Hell Vault                   ////
    ////////////////////////////////////
    function _setHellVaultTreasuryFee(uint16 newFee, uint16 compounderFee) public onlyOwner {
        _hellVaultTreasuryFee = newFee;
        _hellVaultCompounderFee = compounderFee;
        emit HellVaultTreasuryFeesUpdated(newFee, compounderFee);
    }
    ////////////////////////////////////////////////////////////////////
    // Events                                                       ////
    ////////////////////////////////////////////////////////////////////
    event TreasuryAddressUpdated(address indexed treasuryAddress);
    event GeneralPaginationLimitUpdated(uint16 newLimit);
    event UpdatedTokenTrust(address tokenAddress, bool isTrusted);
    // Auction House
    event AuctionHouseTreasuryFeesUpdated(uint16 newFee);
    event MinimumAndMaximumAuctionLengthUpdated(uint newMinimumLength, uint newMaximumLength);
    // Greed Starter
    event GreedStarterTreasuryFeesUpdated(uint16 newFee);
    event MinimumAndMaximumProjectLengthUpdated(uint newMinimumLength, uint newMaximumLength);
    // Hell Vault
    event HellVaultTreasuryFeesUpdated(uint16 newFee, uint16 compounderFee);
}
