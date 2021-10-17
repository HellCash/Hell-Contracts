import {deposit} from "./deposit";
import {withdraw} from "./withdraw";
import {initialize} from "./initialize";
import {withdrawSingleUser} from "./withdrawSingleUser";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function hellVaultTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function deposit', deposit);
    describe('function withdraw', withdraw);
    describe('function withdraw (Single user)', withdrawSingleUser);
}