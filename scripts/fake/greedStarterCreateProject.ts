import {Contract} from "ethers";
import {ethers} from "hardhat";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {contractAddresses} from "../../helpers/NetworkContractAddresses";
import {txConfirmation} from "../../utils/network-utils";

async function main() {
    const addresses = contractAddresses();
    const currentBlock: number = await ethers.provider.getBlockNumber();
    const masterSigner: any = (await ethers.getSigners())[0];
    const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
    const hellAmount = parseEther("100");
    const doublonAmount = parseEther("225000");

    await txConfirmation('Creating HELL for FUSD project', greedStarterContract.createProject(
        addresses.hell, // Token address
        addresses.fusd, // Address of paying currency
        hellAmount, // Total Tokens
        currentBlock + 25, // Starting block
        currentBlock + 2100, // Ending block
        parseUnits("30000", 6), // Price per token
        parseEther("0.01"), // Minimum purchase
        parseEther("10") // Maximum Purchase
    ));

    await txConfirmation('Creating Doublon for Hell project', greedStarterContract.createProject(
        addresses.doublon, // Token address
        addresses.hell, // Address of paying currency
        doublonAmount, // Total Tokens
        currentBlock + 50, // Starting block
        currentBlock + 7000, // Ending block
        parseEther("0.01"), // Price per token
        parseEther("1000"), // Minimum purchase
        parseEther("10000") // Maximum Purchase
    ));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });