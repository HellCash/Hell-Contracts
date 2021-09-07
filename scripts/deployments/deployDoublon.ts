import {Contract} from "ethers";
import {ethers} from "hardhat";
import {Console} from "../../utils/console";

export async function deployDoublon(printLogs: boolean = true): Promise<Contract> {
    const doublonContract = await (await ethers.getContractFactory("Doublon")).deploy();
    if (printLogs) {
        await Console.contractDeploymentInformation("Doublon", doublonContract);
    }
    return doublonContract;
}