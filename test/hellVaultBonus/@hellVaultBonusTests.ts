import {_distributeBonuses} from "./_distributeBonuses";
import {initialize} from "./initialize";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellVaultAddress} from "./_setHellVaultAddress";
import {_setHellVaultHistoryContract} from "./_setHellVaultHistoryContract";
import {_createBonus} from "./_createBonus";

export function hellVaultBonusTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _createBonus', _createBonus);
    describe('function _distributeBonuses', _distributeBonuses);
    describe('function _setHellVaultAddress', _setHellVaultAddress);
    describe('function _setHellVaultHistoryContract', _setHellVaultHistoryContract);
}