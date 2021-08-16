import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";

export function greedStarterTests() {
    describe('initialize', initialize);
    describe('createProject', createProject);
}