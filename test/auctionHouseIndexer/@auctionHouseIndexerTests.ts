import {initialize} from "./initialize.test";
import {_setAuctionHouseContractAddress} from "./_setAuctionHouseContract.test";
import {_registerNewAuctionCreation} from "./_registerNewAuctionCreation.test";
import {_registerUserParticipation} from "./_registerUserParticipation.test";
import {_registerAuctionSold} from "./_registerAuctionSold.test";
import {_registerAuctionWon} from "./_registerAuctionWon.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setHellGovernmentContract} from "./_setHellGovernmentContract";

export function auctionHouseIndexerTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setAuctionHouseContract', _setAuctionHouseContractAddress);
    describe('function _setHellGovernmentContract', _setHellGovernmentContract);
    describe('function registerNewAuctionCreation', _registerNewAuctionCreation);
    describe('function registerUserParticipation', _registerUserParticipation);
    describe('function registerAuctionSold', _registerAuctionSold);
    describe('function registerAuctionWon', _registerAuctionWon);
}