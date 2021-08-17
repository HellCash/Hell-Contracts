import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract.test";
import {_registerNewAuctionCreation} from "./_registerNewAuctionCreation.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_registerAuctionSold} from "./_registerAuctionSold.test";
import {_registerAuctionWon} from "./_registerAuctionWon.test";
import {_updateTokenTrust} from "./_updateTokenTrust.test";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
    describe('_updateTokenTrust', _updateTokenTrust);
    describe('registerNewAuctionCreation', _registerNewAuctionCreation);
    describe('registerUserParticipation', _registerUserParticipation);
    describe('registerAuctionSold', _registerAuctionSold);
    describe('registerAuctionWon', _registerAuctionWon);
}