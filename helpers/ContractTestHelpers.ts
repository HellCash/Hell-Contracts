import {deployContracts} from "../scripts/deployContracts";
import {ethers, network} from "hardhat";
import {Signer} from "ethers";
import {Console} from "../utils/console";
import doublonSol from "../artifacts/contracts/external/Doublon.sol/Doublon.json";
import bdoublonSol from "../artifacts/contracts/external/BDoublon.sol/BDoublon.json";
import erc20Sol from "../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
import fusdSol from "../artifacts/contracts/external/FUSD.sol/FUSD.json";
import contractAddresses from "../scripts/contractAddresses.json";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";
let hellAddress: string;
let vaultAddress: string;

export class ContractTestHelpers {
    accountSigners: SignerWithAddress[] = [];
    accountAddresses: Array<string> = [];

    static async mineBlocks(numberOfBlocks: Number) {
        Console.logHr();
        console.log("\tMining " + numberOfBlocks + " blocks");
        for(let i = 0; i < numberOfBlocks; i++) {
            console.log('\tCurrent Block Number: ' + await ethers.provider.getBlockNumber());
            await network.provider.send("evm_mine");
        }
        console.log('\tMining Completed');
        Console.logHr();
    }
    static async getERC20Contract(contractAddress: string, accountSigner?: Signer) {
        return await ethers.getContractAt(erc20Sol.abi, contractAddress, accountSigner);
    }
    static async getDoublonContract(accountSigner?: Signer) {
        return await ethers.getContractAt(doublonSol.abi, contractAddresses.doublon, accountSigner);
    }
    static async getBDoublonContract(accountSigner?: Signer) {
        return await ethers.getContractAt(bdoublonSol.abi, contractAddresses.bDoublon, accountSigner);
    }
    static async getFUSDContract(accountSigner?: Signer) {
        return await ethers.getContractAt(bdoublonSol.abi, contractAddresses.bDoublon, accountSigner);
    }
}