import {initialize} from "./initialize.test";
import {_registerTrustedProject} from "./_registerTrustedProject.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";

export function greedStarterIndexerTests() {
    describe('initialize', initialize);
    describe('_registerTrustedProject', _registerTrustedProject);
    describe('_registerUserParticipation', _registerUserParticipation);
}