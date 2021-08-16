import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";
import {invest} from "./invest.test";

export function greedStarterTests() {
    describe('initialize', initialize);
    describe('createProject', createProject);
    describe('invest', invest);
}