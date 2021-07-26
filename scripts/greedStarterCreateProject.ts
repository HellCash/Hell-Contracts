import {Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import {GreedStarterHelpers} from "../helpers/GreedStarterHelpers";
import {EtherUtils} from "../utils/ether-utils";
import {parseEther} from "ethers/lib/utils";
import contractAddresses from "./contractAddresses.json";
import {HellTestHelpers} from "../helpers/HellTestHelpers";
import {Console} from "../utils/console";

async function main() {
    const masterSigner: Signer = (await ethers.getSigners())[0];
    const currentBlock: number = await ethers.provider.getBlockNumber();
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    await hellContract.approve(contractAddresses.greedStarter, parseEther("200"));
    const greedStarterIndexerContract: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract(masterSigner);
    const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
    Console.logTitle('Creating HELL project');
    console.log('indexer address: ', await greedStarterContract._indexerAddress());
    console.log('starter address: ', await greedStarterIndexerContract._greedStarterAddress());
    const tx = await greedStarterContract.createProject(
        contractAddresses.hell, // Token address
        EtherUtils.zeroAddress(), // Address of paying currency
        parseEther("100"), // Total Tokens
        currentBlock + 25, // Starting block
        currentBlock + 5500, // Ending block
        parseEther("3"), // Price per token
        parseEther("1"), // Minimum purchase
        parseEther("10") // Maximum Purchase
    );
    const txReceipt = await tx.wait(1);
    if (txReceipt.status == 1) {
        console.log('Hell Project created Successfully');
    } else {
        console.log('Failed to create Hell project');
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });