import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import timelockController from "../artifacts/contracts/TimelockController.sol/TimelockController.json";
import {contractAddresses} from "./NetworkContractAddresses";

export class TimelockControllerHelpers {
    static async getTimelockControllerContract(accountSigner?: Signer): Promise<Contract> {
        // @ts-ignore
        return await ethers.getContractAt(timelockController.abi, contractAddresses().timelockContract, accountSigner);
    }
}