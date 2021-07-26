import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {parseEther} from "ethers/lib/utils";

export async function deployHellVault(hellContractAddress: string, hellTreasuryAddress: string): Promise<Contract> {
    const hellVaultContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("HellVault"),[
            hellContractAddress, hellTreasuryAddress
    ], {
        kind: 'uups',
    });
    await Console.contractDeploymentInformation("Hell Vault", hellVaultContractProxy);
    console.log("Hell Vault Contract: Setting up dividend periods");
    await hellVaultContractProxy._setDividendPeriods([
        { from: 0,   to: 199, rewardPerBlock:  6335616438},
        { from: 200, to: 250, rewardPerBlock:  4892774698},
        { from: 251, to: 300, rewardPerBlock:  3521682070},
        { from: 301, to: 350, rewardPerBlock:  2597036494},
        { from: 351, to: 400, rewardPerBlock:  1919118946},
        { from: 401, to: 450, rewardPerBlock:  1393168002},
        { from: 451, to: 500, rewardPerBlock:   993303416},
        { from: 501, to: 550, rewardPerBlock:   662580933},
        { from: 551, to: 600, rewardPerBlock:   359778564},
        { from: 601, to: 650, rewardPerBlock:   218797564},
        { from: 651, to: 666, rewardPerBlock:   116872144},
    ]);
    return hellVaultContractProxy;
}