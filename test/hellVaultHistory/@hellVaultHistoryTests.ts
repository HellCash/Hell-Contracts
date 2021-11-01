import {initialize} from "./initialize";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellVaultBonusAddress} from "./_setHellVaultBonusAddress";

export function hellVaultHistoryTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setHellVaultBonusAddress', _setHellVaultBonusAddress);
}