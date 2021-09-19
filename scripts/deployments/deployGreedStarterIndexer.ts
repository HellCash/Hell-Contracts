import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployGreedStarterIndexer(hellGovernmentAddress: string, greedStarterContractAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const greedStarterIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarterIndexer"), [
            hellGovernmentAddress,
            greedStarterContractAddress
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("GreedStarterIndexer", greedStarterIndexerContractProxy);
    }

    return greedStarterIndexerContractProxy;
}