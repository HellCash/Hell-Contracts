import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";

export async function deployGreedStarter(treasuryAddress: string): Promise<Contract> {
    const greedStarterProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarter"), [treasuryAddress, 100], {kind: 'uups'});
    await Console.contractDeploymentInformation("GreedStarter", greedStarterProxy);
    return greedStarterProxy;
}