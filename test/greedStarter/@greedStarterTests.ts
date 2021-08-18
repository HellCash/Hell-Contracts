import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";
import {invest} from "./invest.test";
import {claimFundsTest} from "./claimFunds.test";
import {_setIndexer} from "./_setIndexer.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees";
import {_setMinimumProjectLength} from "./_setMinimumProjectLength.test";
import {bottomEdges} from "./bottomEdges.test";

export function greedStarterTests() {
    describe('function initialize', initialize);
    describe('function _setIndexer', _setIndexer);
    describe('function _setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('function _setMinimumProjectLength', _setMinimumProjectLength);
    describe('function createProject', createProject);
    describe('function invest', invest);
    describe('function claimFunds', claimFundsTest);
    describe('bottom edges', bottomEdges);
}