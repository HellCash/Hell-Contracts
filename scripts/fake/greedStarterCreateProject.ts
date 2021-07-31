import {Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {EtherUtils} from "../../utils/ether-utils";
import {parseEther} from "ethers/lib/utils";
import contractAddresses from "../contractAddresses.json";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {Console} from "../../utils/console";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";

async function main() {
    const masterSigner: Signer = (await ethers.getSigners())[0];
    const currentBlock: number = await ethers.provider.getBlockNumber();
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
    const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);

    const hellAmount = parseEther("100");
    const doublonAmount = parseEther("125000");

    await hellContract.approve(contractAddresses.greedStarter, hellAmount);
    await doublonContract.approve(contractAddresses.greedStarter, doublonAmount);

    Console.logTitle('Creating Doublon project');
    const doublonProjectTx = await greedStarterContract.createProject(
        contractAddresses.doublon, // Token address
        contractAddresses.hell, // Address of paying currency
        doublonAmount, // Total Tokens
        currentBlock + 50, // Starting block
        currentBlock + 7000, // Ending block
        parseEther("0.00001"), // Price per token
        parseEther("1000"), // Minimum purchase
        parseEther("10000") // Maximum Purchase
    );

    const doublonProjectTxReceipt = await doublonProjectTx.wait(1);
    if (doublonProjectTxReceipt.status == 1) {
        console.log('Doublon project created Successfully');
    } else {
        console.log('Failed to create Doublon project');
    }

    Console.logTitle('Creating HELL project');
    const hellProjectTx = await greedStarterContract.createProject(
        contractAddresses.hell, // Token address
        EtherUtils.zeroAddress(), // Address of paying currency
        hellAmount, // Total Tokens
        currentBlock + 25, // Starting block
        currentBlock + 5500, // Ending block
        parseEther("3"), // Price per token
        parseEther("1"), // Minimum purchase
        parseEther("10") // Maximum Purchase
    );
    const hellProjectTxReceipt = await hellProjectTx.wait(1);
    if (hellProjectTxReceipt.status == 1) {
        console.log('Hell project created successfully');
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