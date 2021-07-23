// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BDoublon is ERC20, Ownable {
    constructor () ERC20("Burning Doublon", "BDOUBLON") {
        _mint(msg.sender, 12500000 * (10 ** decimals()));
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        amount = _burnFees(sender, amount);
        return super.transferFrom(sender, recipient, amount);
    }

    // Like Hell this token will burn it self on each transaction, resulting on less being received
    function transfer(address recipient, uint amount) public override returns (bool) {
        amount = _burnFees(msg.sender, amount);
        return super.transfer(recipient, amount);
    }

    function _burnFees(address sender, uint amount) internal returns(uint remaining) {
        require(balanceOf(sender) >= amount, "You don't have enough funds");
        uint amountToBurn = 10 * (amount / 100);
        if (amountToBurn > 0) {
            // Subtract Burn fees
            amount -= amountToBurn;
            // Burn Fees
            _burn(sender, amountToBurn);
        }
        return amount;
    }
}
