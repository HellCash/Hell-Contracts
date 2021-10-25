// SPDX-License-Identifier: BSD 3-Clause
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;

interface IHellVaultBonus {
    function _distributeBonuses (
        address userAddress,
        uint userLastVaultDividendBlock,
        uint stakeToReward
    ) external;
}
