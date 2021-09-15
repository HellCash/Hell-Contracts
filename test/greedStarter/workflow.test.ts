import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {Project} from "../../models/project";
import {formatEther, formatUnits, parseEther} from "ethers/lib/utils";
import erc20Sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import {Random} from "../../utils/random";
import {NetworkUtils} from "../../utils/network-utils";
import {deployRandom} from "../../scripts/deployments/deployRandom";

/*
 Attempts to replicate the workflow of any Greed Starter project while making every respective assertion
 By Creating the project, placing investments until everything gets sold or the project end block is reached
 And finally claiming funds for the creator and all investors that participated.
 */
export function workflow(
    payingCurrency: 'hell' | 'ether' | 'fusd' | 'doublon',
    totalProjectTokens: BigNumber,
    pricePerToken: BigNumber,
    minimumPurchase: BigNumber,
    maximumPurchase: BigNumber,
    randomMinimumAmountToBuy: number,
    randomMaximumAmountToBuy: number,
    randomMaximumDecimals: number = 18,
) {
    return () => {
        let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
        let availableSigners: any[];
        let projectId: BigNumber;
        let project: Project;
        let payingCurrencyAddress: string;
        let randomContract: Contract;

        before(async () => {
            await environment.initialize(300);
            randomContract = await deployRandom(totalProjectTokens, false);
            availableSigners = environment.accountSigners;
            // Remove the master signer and the treasury address from the list of available signers
            availableSigners.splice(0, 2);
            switch (payingCurrency) {
                case "ether":
                    payingCurrencyAddress = EtherUtils.zeroAddress();
                    break;
                case "fusd":
                    payingCurrencyAddress = environment.fusdContract.address;
                    break;
                case "doublon":
                    payingCurrencyAddress = environment.doublonContract.address;
                    break;
                case "hell":
                    payingCurrencyAddress = environment.hellContract.address;
                    break;
            }
        });

        it('should create the project', async () => {
            const currentBlock: number = await ethers.provider.getBlockNumber();
            await randomContract.approve(environment.greedStarterContract.address, totalProjectTokens);
            const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
            await expect(environment.greedStarterContract.createProject(
                randomContract.address, // Token address
                payingCurrencyAddress, // Address of paying currency
                totalProjectTokens, // Total Tokens
                currentBlock + 25, // Starting block
                currentBlock + (environment.minimumProjectLength * 2), // Ending block
                pricePerToken, // Price per token
                minimumPurchase, // Minimum purchase
                maximumPurchase // Maximum Purchase
            )).to.emit(environment.greedStarterContract, "ProjectCreated").withArgs(
                totalProjects.add(1),
                randomContract.address, // Token address
                payingCurrencyAddress, // Address of paying currency
                totalProjectTokens, // Total Tokens
                currentBlock + 25, // Starting block
                currentBlock + (environment.minimumProjectLength * 2), // Ending block
                pricePerToken, // Price per token
            );
            projectId = await environment.greedStarterContract._totalProjects();
            expect(projectId).to.be.equal(totalProjects.add(1));
            project = (await environment.greedStarterContract.getProjects([projectId]))[0];
        });

        let amountsPurchased: BigNumber[] = [];
        let totalPaidByInvestors: BigNumber = BigNumber.from(0);
        it('should perform random investments until everything gets sold or the project ends', async () => {
            console.log('\t performing investments');
            let payingTokenDecimals: number = 18;
            const blocksRemaining = project.startingBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
            // Mine blocks until project starts
            await NetworkUtils.mineBlocks(blocksRemaining);

            if (project.paidWith != EtherUtils.zeroAddress()) {
                const payingTokenContract: Contract = await ethers.getContractAt(erc20Sol.abi, project.paidWith);
                payingTokenDecimals = await payingTokenContract.decimals();
            }

            for (let i = 0; i < availableSigners.length; i++) {
                // Request the project
                const latestProjectDetails: Project = (await environment.greedStarterContract.getProjects([projectId]))[0];
                const availableTokens = latestProjectDetails.totalTokens.sub(latestProjectDetails.totalSold);

                const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber());
                // If there isn't anything left to sell or the project ended, break the loop
                if (availableTokens.isZero() || blocksRemaining.isZero()) {
                    break;
                }
                let amountToBuy: BigNumber;
                if (availableTokens.gte(latestProjectDetails.maximumPurchase)) {
                    const randomAmountToBuy = Random.randomNumber(randomMinimumAmountToBuy, randomMaximumAmountToBuy).toFixed(randomMaximumDecimals);
                    amountToBuy = parseEther(randomAmountToBuy);
                } else {
                    amountToBuy = availableTokens;
                }

                try {
                    const amountPaid = await performInvestment(environment, availableSigners[i], projectId, amountToBuy);
                    totalPaidByInvestors = totalPaidByInvestors.add(amountPaid);
                    amountsPurchased.push(amountToBuy);
                    console.log(`\t [Guest ${i}] (purchased: ${formatEther(amountToBuy)} | ${amountToBuy} wei) (paid: ${formatUnits(amountPaid, payingTokenDecimals)} | ${amountPaid} wei)`);
                } catch (e) {
                    // If the investment failed due the project ending block, no exceptions will be thrown
                    if (e.message != "VM Exception while processing transaction: reverted with reason string 'I3'") {
                        throw e;
                    }
                }
            }
        });

        it('should claimFunds with every investor', async () => {
            console.log('\t Claiming funds with every investor, this might take a while...');
            const blocksRemaining = project.endsAtBlock.sub(await ethers.provider.getBlockNumber()).toNumber();
            // If the project hasn't finished yet, Mine blocks until it ends
            if (blocksRemaining > 0) {
                await NetworkUtils.mineBlocks(blocksRemaining);
            }
            // For every purchase, we'll make the required assertions
            for (let i = 0; i < amountsPurchased.length; i++) {
                const signer = availableSigners[i];
                const expectedRewards: BigNumber = await environment.greedStarterContract._pendingRewards(projectId, signer.address);
                await expect(environment.greedStarterContract.connect(signer).claimFunds(projectId))
                    .to.emit(environment.greedStarterContract, 'RewardsClaimed')
                    .withArgs(projectId, signer.address, expectedRewards);
            }
        });

        it('project creator should be able to claim funds and receive the total paid by investor minus treasury fees', async () => {
            const latestProjectDetails: Project = (await environment.greedStarterContract.getProjects([projectId]))[0];
            const treasuryFees: BigNumber = await environment.greedStarterContract._hellTreasuryFee();
            const expectedFees: BigNumber = latestProjectDetails.rewardsCollected.div(treasuryFees);
            const expectedRewards: BigNumber = latestProjectDetails.rewardsCollected;
            const leftOverTokens: BigNumber = latestProjectDetails.totalTokens.sub(latestProjectDetails.totalSold);
            const rewardedAfterFees: BigNumber = expectedRewards.sub(expectedFees);
            // Verify that the totalPaidByInvestors is the same as the expectedRewards
            expect(totalPaidByInvestors).to.be.equal(expectedRewards);
            await expect(environment.greedStarterContract.claimFunds(projectId))
                .to.emit(environment.greedStarterContract, 'CreatorWithdrawnFunds')
                .withArgs(latestProjectDetails.id, latestProjectDetails.createdBy, expectedRewards,
                    expectedFees, rewardedAfterFees, leftOverTokens);
        });
    }
}

async function performInvestment(
    environment: greedStarterTestingEnvironment,
    signer: any,
    projectId: BigNumber,
    amountToBuy: BigNumber): Promise<BigNumber> {

    const greedStarterContract: Contract = environment.greedStarterContract.connect(signer);
    const project: Project = (await greedStarterContract.getProjects([projectId]))[0];
    const totalPaid: BigNumber = await greedStarterContract._paidAmount(projectId, signer.address);
    const totalRewards: BigNumber = await greedStarterContract._pendingRewards(projectId, signer.address);
    const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

    let override = {};
    if (project.paidWith == EtherUtils.zeroAddress()) {
        override = {value: amountToPay};
    } else {
        // We'll assume that the Master signer has enough funds to share with every guest
        const masterSignerPayingTokenContract: Contract = await ethers.getContractAt(erc20Sol.abi, project.paidWith, environment.masterSigner);
        // Transfer the amountToPay to the guest user.
        await masterSignerPayingTokenContract.transfer(signer.address, amountToPay);
        // Increase guest allowances
        const payingTokenContract: Contract = await ethers.getContractAt(erc20Sol.abi, project.paidWith, signer);
        await payingTokenContract.approve(environment.greedStarterContract.address, amountToPay);
    }

    await expect(greedStarterContract.invest(projectId, amountToBuy, override))
        .to.emit(greedStarterContract, 'InvestedInProject')
        .withArgs(
            projectId,
            signer.address,
            amountToPay,
            amountToBuy,
            totalPaid.add(amountToPay),
            totalRewards.add(amountToBuy),
        );
    expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(projectId, signer.address));
    return amountToPay;
}