import {HellVaultTestingEnvironment} from "../hellVault/@hellVaultTestingEnvironment";
import {formatEther, parseEther} from "ethers/lib/utils";
import {deployRandom} from "../../scripts/deployments/deployRandom";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";
import {Random} from "../../utils/random";
import {BigNumber} from "ethers";
import {ethers} from "hardhat";
import erc20Sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

export class HellVaultBonusTestingEnvironment extends HellVaultTestingEnvironment {
    async initialize(): Promise<void> {
        await super.initialize();
    }

    async createTestingBonuses(): Promise<HellVaultBonusInfo[]> {
        const _maximumBonuses: BigNumber = await this.hellVaultBonusContract._maximumBonuses();
        // Create testing bonuses filling the whole current bonuses array
        for (let i = 0; i < _maximumBonuses.toNumber(); i++) {
            const totalAmount = parseEther(Random.randomIntegerNumber(100,25000).toString());
            const randomToken = await deployRandom(totalAmount, testingEnvironmentDeploymentOptions);
            const rewardPerBlock = totalAmount.div(Random.randomIntegerNumber(25000, 10000000));
            // Increase allowances
            await randomToken.approve(this.hellVaultBonusContract.address, totalAmount);
            // Create the new bonus
            await this.hellVaultBonusContract._createBonus(
                randomToken.address,
                totalAmount,
                rewardPerBlock,
            );
            // Start the bonus, So that users can start receiving them
            await this.hellVaultBonusContract._startBonus(
                i, // Index
                await this.hellVaultBonusContract._totalBonuses() // bonusId
            );
        }
        // Return HellVaultBonuses after their addition
        return await this.hellVaultBonusContract.getCurrentBonuses();
    }

    async logBonusAndUserInfo() {
        const bonusesInfo: HellVaultBonusInfo[] = await this.hellVaultBonusContract.getCurrentBonuses();
        console.log(`\tBlock number: ${await ethers.provider.getBlockNumber()}`);
        for (let bonusInfo of bonusesInfo) {
            const bonusContract = await ethers.getContractAt(erc20Sol.abi, bonusInfo.tokenAddress);
            const userBalance = await bonusContract.balanceOf(this.guest1Signer.address);
            console.log(`\n\t\t[Project Info]`);
            console.log(`\t\tToken: ${bonusContract.address}`);
            console.log(`\t\tReward Per block: ${formatEther(bonusInfo.rewardPerBlock)} (${bonusInfo.rewardPerBlock} wei)`);
            console.log(`\t\tTotal Amount: ${formatEther(bonusInfo.totalAmount)} (${bonusInfo.totalAmount} wei)`);
            console.log(`\t\tAmount Available: ${formatEther(bonusInfo.amountAvailable)} (${bonusInfo.amountAvailable} wei)`);
            console.log(`\t\tStarting block: ${bonusInfo.startingBlock}`);
            console.log(`\t\tEnded at block: ${bonusInfo.endedAtBlock}`);
            console.log(`\t\t[User Info]`);
            console.log(`\t\tBalance: ${formatEther(userBalance)} (${userBalance} wei)`);
            console.log(`\t\tBlocks Earned: ${bonusInfo.blocksEarned}`);
            console.log(`\t\tUnrealized rewards: ${bonusInfo.userUnrealizedRewards}`);
        }
    }
}