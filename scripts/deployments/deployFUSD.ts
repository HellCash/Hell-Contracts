import {Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployFUSD(deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const fusdContract = await (await ethers.getContractFactory("FUSD")).deploy();
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("FUSD", fusdContract);
    }
    return fusdContract;
}