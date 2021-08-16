import {createAuction} from "./auctionHouse/createAuction.test";
import {increaseBid} from "./auctionHouse/increaseBid.test";
import {claimFunds} from "./auctionHouse/claimFunds.test";
import {_setTreasuryAddressAndFees} from "./auctionHouse/_setTreasuryAddressAndFees.test";
import {initialize} from "./auctionHouse/initialize.test";
import {_setIndexer} from "./auctionHouse/_setIndexer.test";
import {_forceEndAuction} from "./auctionHouse/_forceEndAuction.test";

describe('[Auction House]',() => {
    describe('initialize', initialize);
    describe('_setTreasuryAddressAndFees', _setTreasuryAddressAndFees);
    describe('_setIndexer', _setIndexer);
    describe('_forceEndAuction', _forceEndAuction);
    describe('createAuction', createAuction);
    describe('increaseBid', increaseBid);
    describe('claimFunds', claimFunds);
});