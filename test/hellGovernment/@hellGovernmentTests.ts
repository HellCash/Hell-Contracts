import {initialize} from "./initialize.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function hellGovernmentTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
}