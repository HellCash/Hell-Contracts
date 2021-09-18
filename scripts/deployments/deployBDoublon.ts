import {Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployBDoublon(deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const bdoublonContract = await (await ethers.getContractFactory("BDoublon")).deploy();
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("BDoublon", bdoublonContract);
    }
    return bdoublonContract;
}