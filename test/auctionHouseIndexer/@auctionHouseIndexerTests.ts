import {initialize} from "./initialize.test";
import {_setAuctionHouseContract} from "./_setAuctionHouseContract.test";
import {_registerNewAuctionCreation} from "./_registerNewAuctionCreation.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_registerAuctionSold} from "./_registerAuctionSold.test";
import {_registerAuctionWon} from "./_registerAuctionWon.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";

export function auctionHouseIndexerTests() {
    describe('initialize', initialize);
    describe('upgradeTo', upgradeTo);
    describe('upgradeToAndCall', upgradeToAndCall);
    describe('_setAuctionHouseContract', _setAuctionHouseContract);
    describe('registerNewAuctionCreation', _registerNewAuctionCreation);
    describe('registerUserParticipation', _registerUserParticipation);
    describe('registerAuctionSold', _registerAuctionSold);
    describe('registerAuctionWon', _registerAuctionWon);
}