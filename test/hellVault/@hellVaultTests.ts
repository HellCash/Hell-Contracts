import {initialize} from "./initialize";
import {deposit} from "./deposit";

export function hellVaultTests() {
    describe('function initialize', initialize);
    describe('function deposit', deposit);
}