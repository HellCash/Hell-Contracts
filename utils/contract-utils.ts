import {ethers} from "hardhat";
import {getImplementationAddress} from "@openzeppelin/upgrades-core";
import {Contract} from "ethers";
import {txConfirmation} from "./network-utils";

export class ContractUtils {
    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    static async initializeImplementation(contractSol: any, proxyContract: Contract, args: any[]) {
        const implementationAddress: string = await getImplementationAddress(ethers.provider, proxyContract.address);
        const implementationContract: Contract = await ethers.getContractAt(contractSol.abi, implementationAddress);
        await txConfirmation('[Contract Implementation]: Initialize with Gibberish values',
            implementationContract.initialize(...args));
    }
}