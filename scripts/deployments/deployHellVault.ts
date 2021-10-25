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

    // await hellVaultContractProxy._setDividendPeriods([
    //     { from: 0,   to: 199, rewardPerBlock:   633562},
    //     { from: 200, to: 250, rewardPerBlock:   489277},
    //     { from: 251, to: 300, rewardPerBlock:   352168},
    //     { from: 301, to: 350, rewardPerBlock:   259704},
    //     { from: 351, to: 400, rewardPerBlock:   191912},
    //     { from: 401, to: 450, rewardPerBlock:   139317},
    //     { from: 451, to: 500, rewardPerBlock:    99330},
    //     { from: 501, to: 550, rewardPerBlock:    66258},
    //     { from: 551, to: 600, rewardPerBlock:    35978},
    //     { from: 601, to: 650, rewardPerBlock:    21880},
    //     { from: 651, to: 666, rewardPerBlock:    11687},
    // ]);

    await hellVaultContractProxy._setDividendPeriods([
        { from: 0,   to: 199, rewardPerBlock: 633562},
        { from: 200, to: 224, rewardPerBlock: 532032},
        { from: 225, to: 249, rewardPerBlock: 449586},
        { from: 250, to: 274, rewardPerBlock: 382915},
        { from: 275, to: 299, rewardPerBlock: 327883},
        { from: 300, to: 324, rewardPerBlock: 281686},
        { from: 325, to: 349, rewardPerBlock: 242353},
        { from: 350, to: 374, rewardPerBlock: 208460},
        { from: 375, to: 399, rewardPerBlock: 178950},
        { from: 400, to: 424, rewardPerBlock: 153026},
        { from: 425, to: 449, rewardPerBlock: 130070},
        { from: 450, to: 474, rewardPerBlock: 109601},
        { from: 475, to: 499, rewardPerBlock: 91234},
        { from: 500, to: 524, rewardPerBlock: 74663},
        { from: 525, to: 549, rewardPerBlock: 59635},
        { from: 550, to: 574, rewardPerBlock: 45945},
        { from: 575, to: 599, rewardPerBlock: 33421},
        { from: 600, to: 624, rewardPerBlock: 21921},
        { from: 625, to: 649, rewardPerBlock: 11324},
        { from: 650, to: 666, rewardPerBlock: 3029},
    ]);

    return hellVaultContractProxy;
}