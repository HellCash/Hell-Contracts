import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployRandom(amountToMint: BigNumber, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const randomContract = await (await ethers.getContractFactory("Random")).deploy(amountToMint);
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("RANDOM", randomContract);
    }
    return randomContract;
}