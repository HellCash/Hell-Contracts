import {HellVaultTestingEnvironment} from "../hellVault/@hellVaultTestingEnvironment";
import {parseEther} from "ethers/lib/utils";
import {deployRandom} from "../../scripts/deployments/deployRandom";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";
import {Random} from "../../utils/random";

export class HellVaultHistoryTestingEnvironment extends HellVaultTestingEnvironment {
    async initialize(): Promise<void> {
        await super.initialize();
    }
}