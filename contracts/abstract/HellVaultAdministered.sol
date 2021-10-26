// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../HellVault.sol";

abstract contract HellVaultAdministered is Initializable, OwnableUpgradeable {
    HellVault internal _hellVault;

    function _setHellVaultAddress(address newHellVaultAddress) public onlyOwner {
        require(newHellVaultAddress != address (0), "The Hell Vault address cannot be the zero address");
        _hellVault = HellVault(newHellVaultAddress);
        emit HellVaultAddressUpdated(newHellVaultAddress);
    }

    modifier onlyHellVault {
        require(msg.sender == address(_hellVault), "Only the Hell Vault might trigger this function");
        _;
    }

    event HellVaultAddressUpdated(address newHellVaultAddress);
}