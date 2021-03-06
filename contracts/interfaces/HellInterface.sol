// SPDX-License-Identifier: BSD 3-Clause
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
abstract contract HellInterface is IERC20Upgradeable {
    function mintVaultRewards(uint256 amount) external virtual {}
}
