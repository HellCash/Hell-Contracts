import {initialize} from "./initialize.test";
import {upgradeTo} from "./upgradeTo";
import {upgradeToAndCall} from "./upgradeToAndCall";
import {_setTreasuryAddress} from "./_setTreasuryAddress";
import {_setGeneralPaginationLimit} from "./_setGeneralPaginationLimit";
import {_setTokenTrust} from "./_setTokenTrust";
import {_setAuctionHouseTreasuryFees} from "./_setAuctionHouseTreasuryFees";
import {_setGreedStarterTreasuryFees} from "./_setGreedStarterTreasuryFees";
import {_setMinimumAndMaximumAuctionLength} from "./_setMinimumAndMaximumAuctionLength";
import {_setMinimumAndMaximumProjectLength} from "./_setMinimumAndMaximumProjectLength";

export function hellGovernmentTests() {
    describe('function initialize', initialize);
    describe('function upgradeTo', upgradeTo);
    describe('function upgradeToAndCall', upgradeToAndCall);
    describe('function _setTreasuryAddress', _setTreasuryAddress);
    describe('function _setGeneralPaginationLimit', _setGeneralPaginationLimit);
    describe('function _setTokenTrust', _setTokenTrust);
    describe('function _setAuctionHouseTreasuryFees', _setAuctionHouseTreasuryFees);
    describe('function _setGreedStarterTreasuryFees', _setGreedStarterTreasuryFees);
    describe('function _setMinimumAndMaximumAuctionLength', _setMinimumAndMaximumAuctionLength);
    describe('function _setMinimumAndMaximumProjectLength', _setMinimumAndMaximumProjectLength);
    describe('function _setMinimumAndMaximumProjectLength', _setMinimumAndMaximumProjectLength);

}