import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployHellVaultHistory(
    hellVaultAddress: string,
    hellVaultBonusAddress: string,
    deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellVaultHistoryContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("HellVaultHistory"),[
            hellVaultAddress, hellVaultBonusAddress
        ], {
            kind: 'uups',
        });
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("Hell Vault History", hellVaultHistoryContractProxy);
    }

    return hellVaultHistoryContractProxy;
}