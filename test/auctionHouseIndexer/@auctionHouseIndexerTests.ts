import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract.test";
import {registerNewAuctionCreation} from "./registerNewAuctionCreation.test";
import {registerUserParticipation} from "./registerUserParticipation.test";
import {registerAuctionSold} from "./registerAuctionSold.test";
import {registerAuctionWon} from "./registerAuctionWon.test";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
    describe('registerNewAuctionCreation', registerNewAuctionCreation);
    describe('registerUserParticipation', registerUserParticipation);
    describe('registerAuctionSold', registerAuctionSold);
    describe('registerAuctionWon', registerAuctionWon);
}