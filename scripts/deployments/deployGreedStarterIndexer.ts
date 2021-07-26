// @ts-ignore
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";

export async function deployGreedStarterIndexer(greedStarterContractAddress: string): Promise<Contract> {
    const greedStarterIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarterIndexer"), [greedStarterContractAddress], {kind: 'uups'});

    await Console.contractDeploymentInformation("GreedStarterIndexer", greedStarterIndexerContractProxy);
    return greedStarterIndexerContractProxy;
}