import {deposit} from "./deposit";
import {withdraw} from "./withdraw";
import {initialize} from "./initialize";
import {withdrawSingleUser} from "./withdrawSingleUser";

export function hellVaultTests() {
    describe('function initialize', initialize);
    describe('function deposit', deposit);
    describe('function withdraw', withdraw);
    describe('function withdraw (Single user)', withdrawSingleUser);
}