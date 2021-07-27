import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import contractAddresses from "../../scripts/contractAddresses.json";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {EtherUtils} from "../../utils/ether-utils";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";


describe('[Greed Starter] function createProject', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });

    it('Should fail if trying to create a project with the zero address', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(greedStarterContract.createProject(
            EtherUtils.zeroAddress(), // Token address  <------ REVERT
            contractAddresses.hell, // Address of paying currency
            parseEther("20"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5000, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP1"); // Cannot create a project of the network currency
    });

    it('Should fail if the minimum or maximum purchase are set to 0', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        // await (expect);
        throw "Not implemented";
    });

    it('Should fail if the tokenAddress and paidWith address are the same', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(greedStarterContract.createProject(
            contractAddresses.hell, // Token address   <--- REVERT
            contractAddresses.hell, // Address of paying currency  <--- REVERT
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5000, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP2"); // Cannot create a project and sell it for the same currency
    });

    it('Should fail if the project last less than 5000 blocks', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(greedStarterContract.createProject(
            contractAddresses.hell, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 2500, // Ending block  <--- REVERT
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP3"); // The minimum length should be of least 5000 blocks
    });

    it('Should fail if the starting block is higher than the end block', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(greedStarterContract.createProject(
            contractAddresses.hell, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 12000, // Starting block  <--- REVERT
            currentBlock + 10000, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP4"); // The startingBlock should be higher than the current block and lower than the end block
    });

    it('Should fail if the project starts before the current block', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(greedStarterContract.createProject(
            contractAddresses.hell, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock - 1, // Starting block  <--- REVERT
            currentBlock + 10000, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP4"); // Starting block lower than current block
    });

    it('Should fail if the minimumPurchase or maximumPurchase are equal to 0 or if minimumPurchase > maximumPurchase', async() => {
        // Expect to be reverted with CP5
        throw "Not Implemented";
    });

    it('Should fail if the user hasn\'t enough balance', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1Signer);
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const currentBlock = await ethers.provider.getBlockNumber();
        await hellContract.approve(contractAddresses.greedStarter, parseEther("200000"));
        // Expect Revert
        await expect(greedStarterContract.createProject(
            hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("DA2"); // DA2: Not enough Balance
    });

    it('Should fail if the user hasn\'t enough allowance', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        // Set the user Allowance back to 0
        await hellContract.approve(contractAddresses.greedStarter, parseEther("0"));
        // Expect Revert
        await expect(greedStarterContract.createProject(
            hellContract.address, // token address
            EtherUtils.zeroAddress(), // address of paying currency
            parseEther("200"), // total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("DA3"); // DA3: Not enough allowance
    });

    it('Should fail if the amount received was lower than expected', async () => {
        const bDoublon: Contract = await ContractTestHelpers.getBDoublonContract(masterSigner);
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        // Set the user Allowance back to 0
        await bDoublon.approve(contractAddresses.greedStarter, parseEther("1000000"));
        // bDoublon burns it self on transfer, so the amount received was lower, transaction should revert.
        await expect(greedStarterContract.createProject(
            bDoublon.address, // token address
            EtherUtils.zeroAddress(), // address of paying currency
            parseEther("100"), // total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("0.002"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("DA4"); // DA4: You didn't send enough funds for this operation
    });

    it('Should create the project successfully', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock: number = await ethers.provider.getBlockNumber();
        await hellContract.approve(contractAddresses.greedStarter, parseEther("200000"));

        const totalProjects: BigNumber = await greedStarterContract._totalProjects();

        await expect(greedStarterContract.createProject(
            hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("20"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.emit(greedStarterContract,"ProjectCreated").withArgs(
            totalProjects.add(1),
            hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("20"), // Price per token
        );
        await expect(await greedStarterContract._totalProjects()).to.be.equal(totalProjects.add(1));
    });
});