import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {Project} from "../../models/project";
import {NetworkUtils} from "../../utils/network-utils";

export function bottomEdges() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
        await environment.fusdContract.transfer(environment.guest1Signer.address, parseUnits('1',6));
    });

    let project: Project;
    it('HELL/FUSD: should create a project with the lowest params available', async () => {
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        await environment.hellContract.approve(environment.greedStarterContract.address, parseUnits('1', 16));
        const currentBlock = await ethers.provider.getBlockNumber();
        const totalTokens = parseUnits('1', 16);
        const startingBlock = currentBlock + 1;
        const endingBlock = environment.minimumProjectLength.add(currentBlock + 1);
        const pricePerToken = parseUnits('1', 6);
        const minimumPurchase = parseUnits('1', 16);
        const maximumPurchase = parseUnits('1', 16);

        await expect(environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            totalTokens, // Total Tokens
            startingBlock, // Starting block
            endingBlock, // Ending block
            pricePerToken, // Price per token
            minimumPurchase, // Minimum purchase
            maximumPurchase, // Maximum Purchase
        )).to.emit(environment.greedStarterContract,"ProjectCreated").withArgs(
            totalProjects.add(1),
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            totalTokens, // Total Tokens
            startingBlock, // Starting block
            endingBlock, // Ending block
            pricePerToken, // Price per token
        );
        project = (await environment.greedStarterContract.getProjects([totalProjects.add(1)]))[0];
        expect(project.id).to.be.equal(totalProjects.add(1));
        expect(project.tokenAddress).to.be.equal(environment.hellContract.address);
        expect(project.paidWith).to.be.equal(environment.fusdContract.address);
        expect(project.totalTokens).to.be.equal(totalTokens);
        expect(project.startingBlock).to.be.equal(startingBlock);
        expect(project.endsAtBlock).to.be.equal(endingBlock);
        expect(project.pricePerToken).to.be.equal(pricePerToken);
        expect(project.minimumPurchase).to.be.equal(minimumPurchase);
        expect(project.maximumPurchase).to.be.equal(maximumPurchase);
    });

    it('HELL/FUSD: should buy the maximum amount', async () => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);
        const amountToBuy = project.maximumPurchase;
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(project.id, environment.guest1Signer.address);
        expect(totalPaid).to.be.equal(BigNumber.from(0));
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(project.id, environment.guest1Signer.address);
        expect(totalRewards).to.be.equal(BigNumber.from(0));
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));
        // Increase guest1 allowances
        await environment.fusdContract.connect(environment.guest1Signer).approve(environment.greedStarterContract.address, amountToPay);
        await expect(greedStarterContract.invest(project.id, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                project.id,
                environment.guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(project.id, environment.guest1Signer.address));
    });

    it('HELL/FUSD: project creator should claim and receive his rewards', async () => {
        // Get the latest Project data
        project = (await environment.greedStarterContract.getProjects([project.id]))[0];
        const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
        // Mine blocks until project ends
        await NetworkUtils.mineBlocks(blocksRemaining);

        const expectedFees: BigNumber = project.rewardsCollected.div(environment.treasuryFees);
        const expectedRewards: BigNumber = project.rewardsCollected;
        const leftOverTokens: BigNumber  = project.totalTokens.sub(project.totalSold);
        const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);

        const creatorBalance: BigNumber = await environment.fusdContract.balanceOf(project.createdBy);
        const treasuryBalance: BigNumber = await environment.fusdContract.balanceOf(environment.treasurySigner.address);

        await expect(environment.greedStarterContract.claimFunds(project.id))
            .to.emit(environment.greedStarterContract, 'CreatorWithdrawnFunds')
            .withArgs(
                project.id,
                environment.masterSigner.address,
                expectedRewards,
                expectedFees,
                rewardedAfterFees,
                leftOverTokens
            );
        const afterCreatorBalance: BigNumber = await environment.fusdContract.balanceOf(project.createdBy);
        const afterTreasuryBalance: BigNumber = await environment.fusdContract.balanceOf(environment.treasurySigner.address);

        // Make sure the creator received his rewards
        expect(creatorBalance.add(rewardedAfterFees)).to.be.equal(afterCreatorBalance);
        // Make sure treasury fees were paid
        expect(treasuryBalance.add(expectedFees)).to.be.equal(afterTreasuryBalance);
    });

    it('HELL/FUSD: investor should claim and receive his rewards', async () => {
        const expectedRewards: BigNumber = await environment.greedStarterContract._pendingRewards(project.id, environment.guest1Signer.address);
        const balance: BigNumber = await environment.hellContract.balanceOf(environment.guest1Signer.address);
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(project.id))
            .to.emit(environment.greedStarterContract, 'RewardsClaimed')
            .withArgs(project.id, environment.guest1Signer.address, expectedRewards);
        const afterBalance: BigNumber = await environment.hellContract.balanceOf(environment.guest1Signer.address);
        expect(balance.add(expectedRewards)).to.be.equal(afterBalance);
    });

}