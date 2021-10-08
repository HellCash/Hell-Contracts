// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
    @dev This contract will be used to test against transactions with flexible decimals
         In this case we have 6 decimals
*/
contract FUSD is ERC20, Ownable {
    constructor () ERC20("FUSD", "FUSD") {
        _mint(msg.sender, 500000000 * (10 ** decimals()));
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
