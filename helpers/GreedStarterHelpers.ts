import {ethers} from "hardhat";
import {Signer} from "ethers";
import greedStarter from "../artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import greedStarterIndexer from "../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";
import {contractAddresses} from "./NetworkContractAddresses";

export class GreedStarterHelpers {
    static async getGreedStarterContract(accountSigner?: Signer) {
        return await ethers.getContractAt(greedStarter.abi, contractAddresses().greedStarter, accountSigner);
    }
    static async getGreedStarterIndexerContract(accountSigner?: Signer) {
        return await ethers.getContractAt(greedStarterIndexer.abi, contractAddresses().greedStarterIndexer, accountSigner);
    }
}