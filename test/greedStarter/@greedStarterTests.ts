import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";
import {invest} from "./invest.test";
import {claimFundsTest} from "./claimFunds.test";

export function greedStarterTests() {
    describe('initialize', initialize);
    describe('createProject', createProject);
    describe('invest', invest);
    describe('claimFunds', claimFundsTest);
}