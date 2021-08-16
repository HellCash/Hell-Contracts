import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {Project} from "../../models/project";
import {EtherUtils} from "../../utils/ether-utils";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {NetworkUtils} from "../../utils/network-utils";

export function claimFundsTest() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    let hellProjectIdPaidWithFusd: BigNumber;
    let hellProjectIdPaidWithDoublon: BigNumber;
    let doublonProjectIdPaidWithEther: BigNumber;

    before(async() => {
        //Transfer Fusd to guest 1 and Doublon to guest2
        await environment.fusdContract.transfer(environment.guest1Signer.address, parseUnits("300000",6));
        await environment.doublonContract.transfer(environment.guest2Signer.address, parseUnits('10000'));

        const currentBlock = await ethers.provider.getBlockNumber();
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();

        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("100"));
        await environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            parseEther("60"), // Total Tokens
            currentBlock + 5, // Starting block
            currentBlock + environment.minimumProjectLength + 50, // Ending block
            parseUnits("16500",6), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );
        hellProjectIdPaidWithFusd = totalProjects.add(1);

        await environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("40"), // Total Tokens
            currentBlock + 5, // Starting block
            currentBlock + environment.minimumProjectLength + 150, // Ending block
            parseEther("500"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("30"), // Maximum Purchase
        );
        hellProjectIdPaidWithDoublon = totalProjects.add(2);

        await environment.doublonContract.approve(environment.greedStarterContract.address, parseEther("200"));
        await environment.greedStarterContract.createProject(
            environment.doublonContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            currentBlock + 5, // Starting block
            currentBlock + environment.minimumProjectLength + 250, // Ending block
            parseEther("0.5"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );
        doublonProjectIdPaidWithEther = totalProjects.add(3);
    });

    it('Should fail if the Project is still in progress', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(hellProjectIdPaidWithFusd))
            .to.be.revertedWith("CF1");
    });

    it('HELL/FUSD: Project creator should be able to withdraw his rewards and left over tokens', async() => {
        // Mine 10 blocks to ensure the project has started
        await NetworkUtils.mineBlocks(10);
        // Make a investment with guest1Signer
        await environment.fusdContract.connect(environment.guest1Signer)
            .approve(environment.greedStarterContract.address, parseUnits("300000",6));
        await environment.greedStarterContract.connect(environment.guest1Signer)
            .invest(hellProjectIdPaidWithFusd, parseEther('3'));
        // Retrieve current project status
        const project: Project = (await environment.greedStarterContract.getProjects([hellProjectIdPaidWithFusd]))[0];
        const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
        // Mine blocks until project ends
        await NetworkUtils.mineBlocks(blocksRemaining);
        // Execute assertion
        const treasuryFees: BigNumber = await environment.greedStarterContract._hellTreasuryFee();
        const expectedFees: BigNumber = project.rewardsCollected.div(treasuryFees);
        const expectedRewards: BigNumber = project.rewardsCollected;
        const leftOverTokens: BigNumber  = project.totalTokens.sub(project.totalSold);
        const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);

        await expect(environment.greedStarterContract.claimFunds(hellProjectIdPaidWithFusd))
            .to.emit(environment.greedStarterContract, 'CreatorWithdrawnFunds')
            .withArgs(project.id, environment.masterSigner.address, expectedRewards, expectedFees, rewardedAfterFees, leftOverTokens);
    });


    it('HELL/DOUBLON: Project creator should be able to withdraw his rewards and left over tokens', async() => {
        // Make a investment with guest2Signer
        await environment.doublonContract.connect(environment.guest2Signer)
            .approve(environment.greedStarterContract.address, parseEther('5000'));
        await environment.greedStarterContract.connect(environment.guest2Signer).invest(hellProjectIdPaidWithDoublon, parseEther('3'));
        // Retrieve current project status
        const project: Project = (await environment.greedStarterContract.getProjects([hellProjectIdPaidWithDoublon]))[0];
        const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
        // Mine blocks until project ends
        await NetworkUtils.mineBlocks(blocksRemaining);
          // Execute assertion
        const treasuryFees: BigNumber = await environment.greedStarterContract._hellTreasuryFee();
        const expectedFees: BigNumber = project.rewardsCollected.div(treasuryFees);
        const expectedRewards: BigNumber = project.rewardsCollected;
        const leftOverTokens: BigNumber  = project.totalTokens.sub(project.totalSold);
        const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);
        await expect(environment.greedStarterContract.claimFunds(hellProjectIdPaidWithDoublon))
            .to.emit(environment.greedStarterContract, 'CreatorWithdrawnFunds')
            .withArgs(project.id, environment.masterSigner.address, expectedRewards, expectedFees, rewardedAfterFees, leftOverTokens);

    });


    it('DOUBLON/ETHER: Project creator should be able to withdraw his rewards and left over tokens', async() => {
        // Make a investment with guest1Signer
        const amountToPay = parseEther('5')
        await environment.greedStarterContract.connect(environment.guest1Signer)
            .invest(doublonProjectIdPaidWithEther, parseEther('10'),{value: amountToPay});
        // Mined 5000 blocks to ensure the project has ended
        const project: Project = (await environment.greedStarterContract.getProjects([doublonProjectIdPaidWithEther]))[0];
        const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
        // Mine blocks until project ends
        await NetworkUtils.mineBlocks(blocksRemaining);
        // Execute assertion
        const treasuryFees: BigNumber = await environment.greedStarterContract._hellTreasuryFee();
        const expectedFees: BigNumber = project.rewardsCollected.div(treasuryFees);
        const expectedRewards: BigNumber = project.rewardsCollected;
        const leftOverTokens: BigNumber  = project.totalTokens.sub(project.totalSold);
        const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);

        await expect(environment.greedStarterContract.claimFunds(doublonProjectIdPaidWithEther))
            .to.emit(environment.greedStarterContract, 'CreatorWithdrawnFunds')
            .withArgs(project.id, environment.masterSigner.address, expectedRewards, expectedFees, rewardedAfterFees, leftOverTokens);
    });


    it('Should fail if the creator tries to claim more than once', async () => {
        await expect(environment.greedStarterContract.claimFunds(hellProjectIdPaidWithFusd))
            .to.be.revertedWith('CF2');
        await expect(environment.greedStarterContract.claimFunds(doublonProjectIdPaidWithEther))
            .to.be.revertedWith('CF2');
        await expect(environment.greedStarterContract.claimFunds(hellProjectIdPaidWithDoublon))
            .to.be.revertedWith('CF2');
    });


    it('HELL/FUSD: Investors should be able to withdraw his rewards', async() => {
        const expectedRewards: BigNumber = await environment.greedStarterContract._pendingRewards(hellProjectIdPaidWithFusd, environment.guest1Signer.address);
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(hellProjectIdPaidWithFusd))
            .to.emit(environment.greedStarterContract, 'RewardsClaimed')
            .withArgs(hellProjectIdPaidWithFusd, environment.guest1Signer.address, expectedRewards);
    });

    it('HELL/DOUBLON: Investors should be able to withdraw his rewards', async() => {
        const expectedRewards: BigNumber = await environment.greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, environment.guest2Signer.address);
        await expect(environment.greedStarterContract.connect(environment.guest2Signer).claimFunds(hellProjectIdPaidWithDoublon))
            .to.emit(environment.greedStarterContract, 'RewardsClaimed')
            .withArgs(hellProjectIdPaidWithDoublon, environment.guest2Signer.address, expectedRewards);
    });

    it('DOUBLON/ETHER: Investors should be able to withdraw his rewards', async() => {
        const expectedRewards: BigNumber = await environment.greedStarterContract._pendingRewards(doublonProjectIdPaidWithEther, environment.guest1Signer.address);
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(doublonProjectIdPaidWithEther))
            .to.emit(environment.greedStarterContract, 'RewardsClaimed')
            .withArgs(doublonProjectIdPaidWithEther, environment.guest1Signer.address, expectedRewards);
    });

    it('Should fail if investor tries to withdraw his rewards more than once', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(hellProjectIdPaidWithFusd))
            .to.be.revertedWith('CF3');
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(doublonProjectIdPaidWithEther))
            .to.be.revertedWith('CF3');
        await expect(environment.greedStarterContract.connect(environment.guest2Signer).claimFunds(hellProjectIdPaidWithDoublon))
            .to.be.revertedWith('CF3');
    });

    it('Should fail if the project ended and the user tries to claim funds without having invested', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest2Signer).claimFunds(hellProjectIdPaidWithFusd))
            .to.be.revertedWith("CF3");
        await expect(environment.greedStarterContract.connect(environment.guest2Signer).claimFunds(doublonProjectIdPaidWithEther))
            .to.be.revertedWith("CF3");
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).claimFunds(hellProjectIdPaidWithDoublon))
            .to.be.revertedWith("CF3");
    });
}
