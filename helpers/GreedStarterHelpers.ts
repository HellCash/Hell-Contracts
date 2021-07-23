import {ethers} from "hardhat";
import {Signer} from "ethers";
import greedStarter from "../../dApp/src/artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import contractAddresses from "../scripts/contractAddresses.json";

export class GreedStarterHelpers {
    static async getGreedStarterContract(accountSigner?: Signer) {
        return await ethers.getContractAt(greedStarter.abi, contractAddresses.greedStarter, accountSigner);
    }
}