import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract";
import {registerNewAuctionCreation} from "./registerNewAuctionCreation";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
    describe('registerNewAuctionCreation', registerNewAuctionCreation);
}