import {initialize} from "./initialize.test";
import {_registerTrustedProject} from "./_registerTrustedProject.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_setGreedStarterContractAddress} from "./_setGreedStarterContractAddress.test";
import {_removeFromTrustedProjects} from "./_removeFromTrustedProjects.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellGovernmentContract} from "./_setHellGovernmentContract";
import {_registerNewProjectCreation} from "./_registerNewProjectCreation.test";

export function greedStarterIndexerTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setHellGovernmentContract', _setHellGovernmentContract);
    describe('function _registerTrustedProject', _registerTrustedProject);
    describe('function _registerUserParticipation', _registerUserParticipation);
    describe('function _setGreedStarterContractAddress', _setGreedStarterContractAddress);
    describe('function _removeFromTrustedProjects', _removeFromTrustedProjects);
    describe('function _registerNewProjectCreation', _registerNewProjectCreation);
}