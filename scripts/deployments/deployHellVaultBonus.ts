import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployHellVaultBonus(hellVaultAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellVaultBonusContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("HellVaultBonus"),[
            hellVaultAddress
        ], {
            kind: 'uups',
        });
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("Hell Vault Bonus", hellVaultBonusContractProxy);
    }

    return hellVaultBonusContractProxy;
}