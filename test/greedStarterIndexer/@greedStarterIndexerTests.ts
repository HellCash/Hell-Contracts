import {initialize} from "./initialize.test";
import {_registerTrustedProject} from "./_registerTrustedProject.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_setGreedStarterContractAddress} from "./_setGreedStarterContractAddress.test";
import {_removeFromTrustedProjects} from "./_removeFromTrustedProjects.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function greedStarterIndexerTests() {
    describe('initialize', initialize);
    describe('upgradeTo', upgradeTo);
    describe('upgradeToAndCall', upgradeToAndCall);
    describe('_registerTrustedProject', _registerTrustedProject);
    describe('_registerUserParticipation', _registerUserParticipation);
    describe('_setGreedStarterContractAddress', _setGreedStarterContractAddress);
    describe('_removeFromTrustedProjects', _removeFromTrustedProjects);
}