import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import contractAddresses from "../../scripts/contractAddresses.json";
import {Project} from "../../models/project";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {EtherUtils} from "../../utils/ether-utils";

describe('[Greed Starter] function claimFunds',  () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;
    let treasurySigner: any;
    let hellProjectId: BigNumber;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
        treasurySigner = accountSigners[3];

        //Transfer Fusd to guest 1
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);
        await fusdContract.transfer(guest1Signer.address, parseUnits("300000",6));

        // First we increase the allowances of the master signer
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(contractAddresses.greedStarter, parseEther("100"));

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const currentBlock = await ethers.provider.getBlockNumber();
        const totalProjects: BigNumber = await greedStarterContract._totalProjects();

        await greedStarterContract.createProject(
            hellContract.address, // Token address
            fusdContract.address, // Address of paying currency
            parseEther("100"), // Total Tokens
            currentBlock + 5, // Starting block
            currentBlock + 110, // Ending block
            parseUnits("16500",6), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );

        hellProjectId = totalProjects.add(1);


    });

    it('Should fail if the Project is still in progress', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.claimFunds(hellProjectId))
            .to.be.revertedWith("CF1");
    });


    it('Project creator should be able to withdraw his rewards and left over tokens', async() => {
        // Mined 10 blocks to ensure the project has started
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        // Make a investment with guest1Signer
        const guest1GreedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1Signer);
        await fusdContract.approve(contractAddresses.greedStarter, parseUnits("300000",6));
        await guest1GreedStarterContract.invest(hellProjectId, parseEther('3'));

        // Mined 5000 blocks to ensure the project has ended
        for (let i = 0; i < 115; i++) {
            await ethers.provider.send('evm_mine', []);
        }
        // Execute assertion
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        const project: Project = (await greedStarterContract.getProjects([hellProjectId]))[0];
        const treasuryFees: BigNumber = await greedStarterContract._hellTreasuryFee();
        const expectedFees: BigNumber = project.rewardsCollected.div(treasuryFees);
        const expectedRewards: BigNumber = project.rewardsCollected;
        const leftOverTokens: BigNumber  = project.totalTokens.sub(project.totalSold);
        const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);

        await expect(greedStarterContract.claimFunds(hellProjectId))
            .to.emit(greedStarterContract, 'CreatorWithdrawnFunds')
            .withArgs(project.id, masterSigner.address, expectedRewards, expectedFees, rewardedAfterFees, leftOverTokens);

    });


    it('Investors should be able to withdraw his rewards', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const expectedRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectId, guest1Signer.address);
        await expect(greedStarterContract.claimFunds(hellProjectId))
            .to.emit(greedStarterContract, 'RewardsClaimed')
            .withArgs(hellProjectId, guest1Signer.address, expectedRewards);

    });


    it('Should fail if the project is finished and the user tries to claim funds without having invested', async() => {
        // To make this tests we need to wait until the project finishes.
        for (let i = 0; i < 115; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest2Signer);
        await expect(greedStarterContract.claimFunds(hellProjectId))
            .to.be.revertedWith("CF3");
    });


    it('Should fail if investor tries to withdraw his rewards more than once', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.claimFunds(hellProjectId))
            .to.be.revertedWith('CF3');
    });
});
