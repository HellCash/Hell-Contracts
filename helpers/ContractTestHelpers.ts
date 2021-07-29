import {deployContracts} from "../scripts/contractDeployment";
import {ethers, network} from "hardhat";
import {Signer} from "ethers";
import {Console} from "../utils/console";
import doublonSol from "../artifacts/contracts/external/Doublon.sol/Doublon.json";
import bdoublonSol from "../artifacts/contracts/external/BDoublon.sol/BDoublon.json";
import erc20Sol from "../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
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
        let blockNumber = await ethers.provider.getBlockNumber();
        console.log('\tCurrent Block Number: ' + blockNumber);
        for(let i = 0; i < numberOfBlocks; i++) {
            await network.provider.send("evm_mine");
        }
        blockNumber = await ethers.provider.getBlockNumber();
        console.log('\tBlock Number After mining: ' + blockNumber);
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
}