// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../HellGovernment.sol";


abstract contract HellGoverned is Initializable, OwnableUpgradeable {
    HellGovernment internal _hellGovernmentContract;

    function _setHellGovernmentContract(address hellGovernmentAddress) public onlyOwner {
        _hellGovernmentContract = HellGovernment(hellGovernmentAddress);
        emit HellGovernmentContractUpdated(hellGovernmentAddress);
    }

    event HellGovernmentContractUpdated(address newHellGovernmentAddress);
}
