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
    // External functions                                           ////
    ////////////////////////////////////////////////////////////////////
    function deposit(uint amount) external payable nonReentrant {
        // D1: Deposit must be >= 1e12 (0.000001) HELL
        require(amount >= 1e12, "D1");
        // Update the vault, Making all unrealized rewards realized.
        // TODO: updateVault
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
        // TODO: updateVault
        // Claim user pending rewards, avoiding the usage of an additional transaction.
        // TODO: claimRewards
        // Update withdrawn amounts
        _userInfo[msg.sender].hellDeposited -= amount;
        _totalAmountDeposited -= amount;
        // Send the user his funds back
        (msg.sender).safeTransferAsset(address(_hellContract), amount);
        emit Withdraw(msg.sender, amount);
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
}
