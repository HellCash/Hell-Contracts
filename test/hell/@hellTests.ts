import {initialize} from "./initialize.test";
import {calculateBurnFees} from "./calculateBurnFees.test";
import {_setHellVaultAddress} from "./_setHellVaultAddress.test";
import {_setExcludedFromBurnList} from "./_setExcludedFromBurnList.test";
import {transfer} from "./transfer.test";
import {transferFrom} from "./transferFrom.test";
import {mintVaultRewards} from "./mintVaultRewards.test";

export function hellTests() {
    describe('initialize', initialize);
    describe('_setHellVaultAddress', _setHellVaultAddress);
    describe('_setExcludedFromBurnList', _setExcludedFromBurnList);
    describe('calculateBurnFees', calculateBurnFees);
    describe('transfer', transfer);
    describe('transferFrom', transferFrom);
    describe('mintVaultRewards', mintVaultRewards);
}