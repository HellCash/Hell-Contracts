import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";
import {invest} from "./invest.test";
import {claimFundsTest} from "./claimFunds.test";
import {_setIndexer} from "./_setIndexer.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees";

export function greedStarterTests() {
    describe('initialize', initialize);
    describe('_setIndexer', _setIndexer);
    describe('_setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('createProject', createProject);
    describe('invest', invest);
    describe('claimFunds', claimFundsTest);
}