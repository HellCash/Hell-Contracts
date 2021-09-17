import {initialize} from "./initialize.test";
import {calculateBurnFees} from "./calculateBurnFees.test";
import {_setHellVaultAddress} from "./_setHellVaultAddress.test";
import {_setExcludedFromBurnList} from "./_setExcludedFromBurnList.test";
import {transfer} from "./transfer.test";
import {transferFrom} from "./transferFrom.test";
import {mintVaultRewards} from "./mintVaultRewards.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function hellTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setHellVaultAddress', _setHellVaultAddress);
    describe('function _setExcludedFromBurnList', _setExcludedFromBurnList);
    describe('function calculateBurnFees', calculateBurnFees);
    describe('function transfer', transfer);
    describe('function transferFrom', transferFrom);
    describe('function mintVaultRewards', mintVaultRewards);
}