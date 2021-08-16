import {createAuction} from "./auctionHouse/createAuction.test";
import {increaseBid} from "./auctionHouse/increaseBid";
import {claimFunds} from "./auctionHouse/claimFunds";

describe('[Auction House]',() => {
    describe('createAuction', createAuction);
    describe('increaseBid', increaseBid);
    describe('claimFunds', claimFunds);
});