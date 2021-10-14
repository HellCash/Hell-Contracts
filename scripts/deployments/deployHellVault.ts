import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployHellVault(hellContractAddress: string, hellGovernmentAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellVaultContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("HellVault"),[
            hellContractAddress, hellGovernmentAddress
        ], {
            kind: 'uups',
        });
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("Hell Vault", hellVaultContractProxy);
        console.log("Hell Vault Contract: Setting up dividend periods");
    }
    await hellVaultContractProxy._setDividendPeriods([
        { from: 0,   to: 199, rewardPerBlock:   633562},
        { from: 200, to: 250, rewardPerBlock:   489277},
        { from: 251, to: 300, rewardPerBlock:   352168},
        { from: 301, to: 350, rewardPerBlock:   259704},
        { from: 351, to: 400, rewardPerBlock:   191912},
        { from: 401, to: 450, rewardPerBlock:   139317},
        { from: 451, to: 500, rewardPerBlock:    99330},
        { from: 501, to: 550, rewardPerBlock:    66258},
        { from: 551, to: 600, rewardPerBlock:    35978},
        { from: 601, to: 650, rewardPerBlock:    21880},
        { from: 651, to: 666, rewardPerBlock:    11687},
    ]);
    return hellVaultContractProxy;
}