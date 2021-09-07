import {Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";

export async function deployFUSD(printLogs: boolean = true): Promise<Contract> {
    const fusdContract = await (await ethers.getContractFactory("FUSD")).deploy();
    if (printLogs) {
        await Console.contractDeploymentInformation("FUSD", fusdContract);
    }
    return fusdContract;
}