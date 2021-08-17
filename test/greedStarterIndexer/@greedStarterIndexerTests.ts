import {initialize} from "./initialize.test";
import {_registerTrustedProject} from "./_registerTrustedProject.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_setGreedStarterContract} from "./_setGreedStarterContract.test";
import {_removeFromTrustedProjects} from "./_removeFromTrustedProjects.test";

export function greedStarterIndexerTests() {
    describe('initialize', initialize);
    describe('_registerTrustedProject', _registerTrustedProject);
    describe('_registerUserParticipation', _registerUserParticipation);
    describe('_setGreedStarterContract', _setGreedStarterContract);
    describe('_removeFromTrustedProjects', _removeFromTrustedProjects);
}