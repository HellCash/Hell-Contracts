import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract";
import {registerNewAuctionCreation} from "./registerNewAuctionCreation";
import {registerUserParticipation} from "./registerUserParticipation";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
    describe('registerNewAuctionCreation', registerNewAuctionCreation);
    describe('registerUserParticipation', registerUserParticipation);
}