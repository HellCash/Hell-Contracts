// SPDX-License-Identifier: BSD 3-Clause
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

library HellishTransfers {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using AddressUpgradeable for address payable;

    function safeDepositAsset(address recipient, address tokenAddress, uint amount) internal {
        if(tokenAddress == address(0)) {
            // DA1: "You didn't send enough Ether for this operation"
            require(msg.value >= amount, "DA1");
        } else {
            IERC20Upgradeable tokenInterface = IERC20Upgradeable(tokenAddress);
            // DA2: "Not enough balance to perform this action";
            require(tokenInterface.balanceOf(msg.sender) >= amount, "DA2");
            // DA3: "Not enough allowance to perform this action";
            require(tokenInterface.allowance(msg.sender, recipient) >= amount, "DA3");
            uint recipientBalance = tokenInterface.balanceOf(recipient);
            // Transfer Sender tokens to the Recipient
            tokenInterface.safeTransferFrom(msg.sender, recipient, amount);
            // DA4: You didn't send enough tokens for this operation
            require(recipientBalance + amount == tokenInterface.balanceOf(recipient), "DA4");
        }
    }

    function safeTransferAsset(
        address payable recipient,
        address transferredTokenAddress,
        uint amount
    ) internal {
        // If the token is the zero address we know that we are using the network currency
        if(transferredTokenAddress == address(0)) {
            recipient.sendValue(amount);
        } else {
            // if it isn't the zero address, pay with their respective currency
            IERC20Upgradeable tokenInterface = IERC20Upgradeable(transferredTokenAddress);
            tokenInterface.safeTransfer(recipient, amount);
        }
    }

    function safeTransferAssetAndPayFee(
        address payable recipient,
        address transferredTokenAddress,
        uint amount,
        address payable treasuryAddress,
        uint16 treasuryFee
    ) internal returns (uint recipientReceives, uint fee) {
        require(treasuryFee > 0, "Treasury Fees cannot be zero");
        // Fee will be 0 if amount is less than the treasuryFee, causing absolution from treasuryFees
        fee = amount / uint(treasuryFee);
        recipientReceives = amount - fee;
        // If the token is the zero address we know that we are using the network currency
        if (transferredTokenAddress == address(0)) {
            // Pay Treasury Fees
            if(fee > 0) {
                treasuryAddress.sendValue(fee);
            }
            // Send funds to recipient
            recipient.sendValue(recipientReceives);
        } else {
            // Else If the token is a compliant ERC20 token as defined in the EIP
            IERC20Upgradeable tokenInterface = IERC20Upgradeable(transferredTokenAddress);
            // Pay Treasury Fees
            if(fee > 0) {
                tokenInterface.safeTransfer(treasuryAddress, fee);
            }
            // Send funds to recipient
            tokenInterface.safeTransfer(recipient, recipientReceives);
        }
        return (recipientReceives, fee);
    }
}
