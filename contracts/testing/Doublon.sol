// SPDX-License-Identifier: MIT
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Doublon is ERC20, Ownable {
    constructor () ERC20("DOUBLON", "DOUBLON") {
        _mint(msg.sender, 5250000 * (10 ** decimals()));
    }
}
