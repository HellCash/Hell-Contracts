import {initialize} from "./initialize.test";
import {createProject} from "./createProject.test";
import {invest} from "./invest.test";
import {claimFundsTest} from "./claimFunds.test";
import {_setIndexer} from "./_setIndexer.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees";
import {_setMinimumProjectLength} from "./_setMinimumProjectLength.test";
import {bottomEdges} from "./bottomEdges.test";
import {workflow} from "./workflow.test";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {_forceEndProject} from "./_forceEndProject.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function greedStarterTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setIndexer', _setIndexer);
    describe('function _setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('function _setMinimumProjectLength', _setMinimumProjectLength);
    describe('function _forceEndProject', _forceEndProject);
    describe('function createProject', createProject);
    describe('function invest', invest);
    describe('function claimFunds', claimFundsTest);
    describe('bottom edges', bottomEdges);
    describe('Workflow for 0.01 tokens, Paid with Ether, Minimum purchase 0.1, Maximum Purchase 0.1', workflow(
        'ether', // Paid with
        parseEther('0.1'), // Total tokens
        parseEther('100'), // Price per token
        parseEther('0.1'), // Minimum purchase
        parseEther('0.1'), // Maximum Purchase
        // The Random minimum and Random maximum, are used to calculate a random purchase amount between them
        0.1, // Random minimum for purchases
        0.1, // Random maximum for purchases
        1, // Random maximum decimals
    ));
    describe('Workflow for 666 tokens, Paid with ETH, Price per token 10 ETH, Minimum purchase 1e16, Maximum Purchase 10 ether', workflow(
        'ether', // Paid with
        parseEther('666'), // Total tokens
        parseEther('10'), // Price per token
        parseEther('0.01'), // Minimum purchase
        parseEther('10'), // Maximum Purchase
        // The Random minimum and Random maximum, are used to calculate a random purchase amount between them
        0.01, // Random minimum for purchases
        10 // Random maximum for purchases
    ));
    describe('Workflow for 2500 tokens, Paid with ETHER, Price per token 5 ETH, Minimum purchase 0.1 ETH, Maximum Purchase 5 ETH', workflow(
        'ether', // Paid with
        parseEther('2500'), // Total tokens
        parseEther('5'), // Price per token
        parseEther('0.1'), // Minimum purchase
        parseEther('5'), // Maximum Purchase
        // The Random minimum and Random maximum, are used to calculate a random purchase amount between them
        0.1, // Random minimum for purchases
        5 // Random maximum for purchases
    ));
    describe('Workflow for 10000 tokens, Paid with FUSD, Price per token 5.5 FUSD, Minimum purchase 1e16 wei, Maximum Purchase 100 ether', workflow(
        'fusd', // Paid with
        parseEther('10000'), // Total tokens
        parseUnits('5.5', 6), // Price per token
        parseUnits('1', 16), // Minimum purchase
        parseEther('100'), // Maximum Purchase
        // The Random minimum and Random maximum, are used to calculate a random purchase amount between them
        0.01, // Random minimum amount to buy
        100, // Random maximum amount to buy
        18, // Random maximum decimals
    ));
}