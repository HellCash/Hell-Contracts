import {initialize} from "./initialize.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees.test";
import {_setIndexer} from "./_setIndexer.test";
import {_forceEndAuction} from "./_forceEndAuction.test";
import {createAuction} from "./createAuction.test";
import {increaseBid} from "./increaseBid.test";
import {claimFunds} from "./claimFunds.test";
import {_setMinimumAuctionLength} from "./_setMinimumAuctionLength.test";
import {bottomEdges} from "./bottomEdges";

export function auctionHouseTests() {
    describe('function initialize', initialize);
    describe('function _setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('function _setIndexer', _setIndexer);
    describe('function _forceEndAuction', _forceEndAuction);
    describe('function _setMinimumAuctionLength', _setMinimumAuctionLength);
    describe('function createAuction', createAuction);
    describe('function increaseBid', increaseBid);
    describe('function claimFunds', claimFunds);
    describe('bottom edge tests', bottomEdges);
}