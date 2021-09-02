import {network} from "hardhat";
import localAddresses from "../scripts/hardhat-contract-addresses.json";
import rinkebyAddresses from "../scripts/rinkeby-contract-addresses.json";
import mumbaiAddresses from "../scripts/mumbai-contract-addresses.json";
import bsctestnetAddresses from "../scripts/bsctestnet-contract-addresses.json";

export function contractAddresses() {
    switch (network.name) {
        case 'rinkeby':
            return rinkebyAddresses;
        case 'mumbai':
            return mumbaiAddresses;
        case 'localhost':
            return localAddresses;
        case 'bsctestnet':
            return bsctestnetAddresses;
        case 'mainnet':
        case 'hardhat':
        default:
            throw 'Network not configured';
    }
}