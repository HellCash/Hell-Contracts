import {initialize} from "./initialize";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellVaultBonusAddress} from "./_setHellVaultBonusAddress";
import {_setHellVaultAddress} from "./_setHellVaultAddress";
import {_registerUserReward} from "./_registerUserReward";

export function hellVaultHistoryTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setHellVaultBonusAddress', _setHellVaultBonusAddress);
    describe('function _setHellVaultAddress', _setHellVaultAddress);
    describe('function _registerUserReward', _registerUserReward);
}