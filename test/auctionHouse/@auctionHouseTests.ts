import {initialize} from "./initialize.test";
import {_setTreasuryAddressAndFees} from "./_setTreasuryAddressAndFees.test";
import {_setIndexer} from "./_setIndexer.test";
import {_forceEndAuction} from "./_forceEndAuction.test";
import {createAuction} from "./createAuction.test";
import {increaseBid} from "./increaseBid.test";
import {claimFunds} from "./claimFunds.test";
import {_setMinimumAuctionLength} from "./_setMinimumAuctionLength.test";

export function auctionHouseTests() {
    describe('initialize', initialize);
    describe('_setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('_setIndexer', _setIndexer);
    describe('_forceEndAuction', _forceEndAuction);
    describe('_setMinimumAuctionLength', _setMinimumAuctionLength);
    describe('createAuction', createAuction);
    describe('increaseBid', increaseBid);
    describe('claimFunds', claimFunds);
}