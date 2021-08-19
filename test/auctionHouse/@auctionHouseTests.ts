import {initialize} from "./initialize.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees.test";
import {_setIndexer} from "./_setIndexer.test";
import {_forceEndAuction} from "./_forceEndAuction.test";
import {createAuction} from "./createAuction.test";
import {increaseBid} from "./increaseBid.test";
import {claimFunds} from "./claimFunds.test";
import {_setMinimumAuctionLength} from "./_setMinimumAuctionLength.test";
import {bottomEdges} from "./bottomEdges.test";
import {workflow} from "./workflow.test";
import {TokenName} from "../../enums/tokenName";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {BigNumber} from "ethers";

export function auctionHouseTests() {
    describe('function initialize', initialize);
    describe('function _setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('function _setIndexer', _setIndexer);
    describe('function _forceEndAuction', _forceEndAuction);
    describe('function _setMinimumAuctionLength', _setMinimumAuctionLength);
    describe('function createAuction', createAuction);
    describe('function increaseBid', increaseBid);
    describe('function claimFunds', claimFunds);
    describe('bottom edges', bottomEdges);
    describe('Workflow for 5 HELL / 50 ETHER, Buyout for 100 ETH, during 100 blocks, 3 ordered bidders',
        workflow(
            TokenName.Hell, // Auctioned Token
            parseEther('5'), // Auctioned Amount
            TokenName.Ether, // Paying Token
            parseEther('50'), // Starting Price
            parseEther('100'), // Buyout Price
            100,
            3
    ));
    describe('Workflow for 5 ETHER / 30000 FUSD, Buyout for 60000 FUSD, during 200 blocks, 12 randomized bidders',
        workflow(
            TokenName.Ether, // Auctioned Token
            parseEther('5'), // Auctioned Amount
            TokenName.FUSD, // Paying Token
            parseUnits('30000', 6), // Starting Price
            parseUnits('60000', 6), // Buyout Price
            200,
            12,
            true
    ));
    describe('Workflow for 25000 FUSD / 5000 Doublon, No Buyout, during 250 blocks, 100 randomized bidders',
        workflow(
            TokenName.FUSD, // Auctioned Token
            parseUnits('25000', 6), // Auctioned Amount
            TokenName.Doublon, // Paying Token
            parseEther('5000'), // Starting Price
            BigNumber.from(0), // Buyout Price
            250,
            100,
            true
    ));
}