import {ethers} from "hardhat";
import {getImplementationAddress} from "@openzeppelin/upgrades-core";
import {Contract} from "ethers";
import {txConfirmation} from "./network-utils";

export class ContractUtils {
    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    static async initializeImplementation(contractSol: any, proxyContract: Contract, args: any[], printLogs = true) {
        const implementationContract = await ContractUtils.getContractImplementation(contractSol, proxyContract);
        await txConfirmation('[Contract Implementation]: Initialize with Gibberish values',
            implementationContract.initialize(...args), printLogs);
    }

    static async getContractImplementation(contractSol: any, proxyContract: Contract): Promise<Contract> {
        const masterSigner = (await ethers.getSigners())[0];
        const implementationAddress: string = await getImplementationAddress(ethers.provider, proxyContract.address);
        return await ethers.getContractAt(contractSol.abi, implementationAddress, masterSigner);
    }

}