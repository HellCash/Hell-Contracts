import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployGreedStarter(hellGovernmentAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const greedStarterProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarter"), [
            hellGovernmentAddress
        ],
        {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("GreedStarter", greedStarterProxy);
    }

    return greedStarterProxy;
}