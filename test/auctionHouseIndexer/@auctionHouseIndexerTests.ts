import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
}