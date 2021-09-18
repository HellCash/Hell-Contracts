import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";

export function createProject() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if trying to create a project with the zero address', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            EtherUtils.zeroAddress(), // Token address  <------ REVERT
            environment.hellContract.address, // Address of paying currency
            parseEther("20"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP1"); // Cannot create a project of the network currency
    });

    it('Should fail if the minimum or maximum purchase are set to 0', async() => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
           environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("50"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("0"), // Minimum purchase    <--- REVERT
            parseEther("20") // Maximum Purchase
        )).to.be.revertedWith("CP6"); // We enforce this to ensure enough precision on price calculations

        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("50"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("0.01"), // Minimum purchase
            parseEther("0") // Maximum Purchase   <--- REVERT
        )).to.be.revertedWith("CP6"); // We enforce this to ensure enough precision on price calculations
    });

    it('Should fail if the tokenAddress and paidWith address are the same', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address  <------ REVERT
            environment.hellContract.address, // Address of paying currency  <--- REVERT
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP2"); // Cannot create a project and sell it for the same currency
    });

    it('Should fail if the project last less than the minimum length', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.doublonContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 5, // Starting block
            environment.minimumProjectLength.div(2).add(currentBlock), // Ending block  <--- REVERT
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP4"); // The minimum length should be of least the minimun length
    });

    it('Should fail if the starting block is higher than the end block', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 12000, // Starting block     <--- REVERT
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP5"); // The startingBlock should be higher than the current block and lower than the end block
    });

    it('Should fail if the project starts before the current block', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock - 1, // Starting block     <--- REVERT
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP5"); // Starting block lower than current block
    });

    it('The Project Token must have 18 decimals of precision', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.fusdContract.address, // Token address    <--- REVERT, FUSD only has 6 decimals
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP3"); // Token must have 18 decimals
    });

    it('Should fail if minimumPurchase > maximumPurchase', async() => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("20"), // Minimum purchase  <--- REVERT
            parseEther("2") // Maximum Purchase
        )).to.be.revertedWith("CP7"); // Minimum purchase cannot be higher than maximum
    });

    it('The minimumPrice per token should be higher than 1e6 wei', async() => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            BigNumber.from('10000'), // Price per token  <--- REVERT
            parseEther("1"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP8"); // Minimum price per token should be higher tan 1e6 wei

        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            BigNumber.from('1000000').sub(1), // Price per token  <--- REVERT
            parseEther("1"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP8"); // Minimum price per token should be higher tan 1e6 wei
    });

    it('The Total Tokens cannot be lower than the maximum or minimumPurchase', async() => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("4"), // Total Tokens  <--- REVERT
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("CP9");
    });

    it("Should fail if the user hasn't enough balance", async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        await environment.hellContract.connect(environment.guest1Signer).approve(environment.greedStarterContract.address, parseEther("200000"));
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens  <---- REVERT
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
            )).to.be.revertedWith("DA2"); // DA2: Not enough Balance
    });

    it("Should fail if the user hasn't enough allowance", async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        // Set the user Allowance back to 0
        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("0"));
        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // token address
            EtherUtils.zeroAddress(), // address of paying currency
            parseEther("200"), // total Tokens  <--- REVERT
            currentBlock + 5, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("DA3"); // DA3: Not enough allowance
    });

    it('Should fail if the amount received was lower than expected', async () => {
        const currentBlock = await ethers.provider.getBlockNumber();
        // Set the user Allowance back to 0
        await environment.bDoublonContract.approve(environment.greedStarterContract.address, parseEther("1000000"));
        // bDoublon burns it self on transfer, so the amount received will be lower.
        await expect(environment.greedStarterContract.createProject(
            environment.bDoublonContract.address, // token address
            EtherUtils.zeroAddress(), // address of paying currency
            parseEther("100"), // total Tokens  <---- REVERT
            currentBlock + 5, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.002"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.be.revertedWith("DA4"); // DA4: You didn't send enough funds for this operation
    });

    it('HELL/ETHER: Should create the project successfully', async () => {
        const currentBlock: number = await ethers.provider.getBlockNumber();
        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("210"));
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();

        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("20"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.emit(environment.greedStarterContract,"ProjectCreated").withArgs(
            totalProjects.add(1),
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("20"), // Price per token
        );
        const afterTotalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        expect(afterTotalProjects).to.be.equal(totalProjects.add(1));
    });

    it('DOUBLON/FUSD: Should create the project successfully', async () => {
        const currentBlock: number = await ethers.provider.getBlockNumber();
        const projectTotalTokens: BigNumber = parseEther('210');
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();

        await environment.doublonContract.approve(environment.greedStarterContract.address, projectTotalTokens)

        await expect(environment.greedStarterContract.createProject(
            environment.doublonContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            projectTotalTokens, // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseUnits("500",6), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.emit(environment.greedStarterContract,"ProjectCreated").withArgs(
            totalProjects.add(1),
            environment.doublonContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            projectTotalTokens, // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseUnits("500",6), // Price per token
        );

        const afterTotalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        expect(afterTotalProjects).to.be.equal(totalProjects.add(1));
    });

    it('HELL/DOUBLON: Should create the project successfully', async () => {
        const currentBlock: number = await ethers.provider.getBlockNumber();
        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("100"));
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();

        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("100"), // Total Tokens
            currentBlock + 15, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("20"), // Price per token
            parseEther("5"), // Minimum purchase
            parseEther("10") // Maximum Purchase
        )).to.emit(environment.greedStarterContract,"ProjectCreated").withArgs(
            totalProjects.add(1),
            environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("100"), // Total Tokens
            currentBlock + 15, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("20"), // Price per token
        );
        const afterTotalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        await expect(afterTotalProjects).to.be.equal(totalProjects.add(1));
    });

}