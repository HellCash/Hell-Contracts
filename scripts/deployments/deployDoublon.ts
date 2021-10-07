import {Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployDoublon(deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const doublonContract = await (await ethers.getContractFactory("Doublon")).deploy();
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("Doublon", doublonContract);
    }
    return doublonContract;
}