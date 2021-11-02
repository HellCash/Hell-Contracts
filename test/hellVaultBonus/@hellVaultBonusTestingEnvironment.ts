import {HellVaultTestingEnvironment} from "../hellVault/@hellVaultTestingEnvironment";
import {parseEther} from "ethers/lib/utils";
import {deployRandom} from "../../scripts/deployments/deployRandom";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";
import {Random} from "../../utils/random";
import {BigNumber} from "ethers";

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
}