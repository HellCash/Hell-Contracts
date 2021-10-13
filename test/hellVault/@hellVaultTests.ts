import {initialize} from "./initialize";
import {deposit} from "./deposit";
import {withdraw} from "./withdraw";

export function hellVaultTests() {
    describe('function initialize', initialize);
    describe('function deposit', deposit);
    describe('function withdraw', withdraw);
}