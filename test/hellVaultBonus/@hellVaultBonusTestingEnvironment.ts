import {HellVaultTestingEnvironment} from "../hellVault/@hellVaultTestingEnvironment";
import {parseEther} from "ethers/lib/utils";
import {deployRandom} from "../../scripts/deployments/deployRandom";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";
import {Random} from "../../utils/random";

export class HellVaultBonusTestingEnvironment extends HellVaultTestingEnvironment {
    async initialize(): Promise<void> {
        await super.initialize();
    }

    async createTestingBonuses(): Promise<HellVaultBonusInfo[]> {
        const currentBonuses: HellVaultBonusInfo[] = await this.hellVaultBonusContract.getCurrentBonuses();
        // Create testing bonuses filling the whole current bonuses array
        for (let i = 0; i < currentBonuses.length; i++) {
            const totalAmount = parseEther(Random.randomIntegerNumber(100,25000).toString());
            const randomToken = await deployRandom(totalAmount, testingEnvironmentDeploymentOptions);
            const rewardPerBlock = totalAmount.div(Random.randomIntegerNumber(25000, 1000000));
            // Increase allowances
            await randomToken.approve(this.hellVaultBonusContract.address, totalAmount);
            // Create the new bonus
            await this.hellVaultBonusContract._addBonus(
                randomToken.address,
                totalAmount,
                rewardPerBlock,
                i
            );
        }
        // Return HellVaultBonuses after their addition
        return await this.hellVaultBonusContract.getCurrentBonuses();
    }
}