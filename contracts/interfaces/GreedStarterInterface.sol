// SPDX-License-Identifier: BSD 3-Clause
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

interface GreedStarterInterface {
    function createProject(
        address payable tokenAddress,
        address payable paidWith,
        uint totalTokens,
        uint startingBlock,
        uint endsAtBlock,
        uint pricePerToken,
        uint minimumPurchase,
        uint maximumPurchase
    ) external returns(uint);
    function invest(uint projectId, uint amountToBuy) external;
    function claimFunds(uint projectId) external;
}
