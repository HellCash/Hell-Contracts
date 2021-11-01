import {initialize} from "./initialize";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function hellVaultHistoryTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
}