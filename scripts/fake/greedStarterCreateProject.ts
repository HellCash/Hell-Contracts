import {Contract} from "ethers";
import {ethers} from "hardhat";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {EtherUtils} from "../../utils/ether-utils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {Console} from "../../utils/console";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {contractAddresses} from "../../helpers/NetworkContractAddresses";

async function main() {
    const addresses = contractAddresses();

    const signers = await ethers.getSigners();
    const masterSigner: any = signers[0];

    const currentBlock: number = await ethers.provider.getBlockNumber();
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
    const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
    const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);

    const hellAmount = parseEther("100");
    const doublonAmount = parseEther("225000");

    await hellContract.approve(addresses.greedStarter, hellAmount);
    await doublonContract.approve(addresses.greedStarter, doublonAmount.mul(2));
    await fusdContract.approve(addresses.fusd, doublonAmount.mul(2));

    Console.logTitle('Creating HELL for Ether project');
    const hellProjectTx = await greedStarterContract.createProject(
        addresses.hell, // Token address
        EtherUtils.zeroAddress(), // Address of paying currency
        hellAmount, // Total Tokens
        currentBlock + 25, // Starting block
        currentBlock + 120, // Ending block
        parseEther("50"), // Price per token
        parseEther("0.01"), // Minimum purchase
        parseEther("10") // Maximum Purchase
    );
    const hellProjectTxReceipt = await hellProjectTx.wait(1);
    if (hellProjectTxReceipt.status == 1) {
        console.log('Hell project created successfully');
    } else {
        console.log('Failed to create Hell project');
    }

    Console.logTitle('Creating Doublon for Hell project');
    const doublonProjectTx = await greedStarterContract.createProject(
        addresses.doublon, // Token address
        addresses.hell, // Address of paying currency
        doublonAmount, // Total Tokens
        currentBlock + 50, // Starting block
        currentBlock + 7000, // Ending block
        parseEther("0.01"), // Price per token
        parseEther("1000"), // Minimum purchase
        parseEther("10000") // Maximum Purchase
    );

    const doublonProjectTxReceipt = await doublonProjectTx.wait(1);
    if (doublonProjectTxReceipt.status == 1) {
        console.log('Doublon project created Successfully');
    } else {
        console.log('Failed to create Doublon project');
    }

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });