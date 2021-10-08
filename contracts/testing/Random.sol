// SPDX-License-Identifier: MIT
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Random is ERC20, Ownable {
    constructor (uint amountToMint) ERC20("RANDOM", "RANDOM") {
        _mint(msg.sender, amountToMint);
    }
}
