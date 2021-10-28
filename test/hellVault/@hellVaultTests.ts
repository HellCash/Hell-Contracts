import {deposit} from "./deposit";
import {withdraw} from "./withdraw";
import {initialize} from "./initialize";
import {withdrawSingleUser} from "./withdrawSingleUser";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellGovernmentContract} from "./_setHellGovernmentContract";
import {_minimumDeposit} from "./_minimumDeposit";

export function hellVaultTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _minimumDeposit', _minimumDeposit);
    describe('function _setHellGovernmentContract', _setHellGovernmentContract);
    describe('function deposit', deposit);
    describe('function withdraw', withdraw);
    describe('function withdraw (Single user)', withdrawSingleUser);
}