import {initialize} from "./initialize.test";
import {_registerTrustedProject} from "./_registerTrustedProject.test";

export function greedStarterIndexerTests() {
    describe('initialize', initialize);
    describe('_registerTrustedProject', _registerTrustedProject);
}