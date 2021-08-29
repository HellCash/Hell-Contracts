import {ethers} from "hardhat";
import {Signer} from "ethers";
import timelockController from "../artifacts/contracts/TimelockController.sol/TimelockController.json";
import {contractAddresses} from "./NetworkContractAddresses";

export class TimelockControllerHelpers {
    static async getTimelockControllerContract(accountSigner?: Signer) {
        // @ts-ignore
        return await ethers.getContractAt(timelockController.abi, contractAddresses().timelockContract, accountSigner);
    }
}