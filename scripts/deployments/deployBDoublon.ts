import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";

export async function deployBDoublon(printLogs: boolean = true): Promise<Contract> {
    const bdoublonContract = await (await ethers.getContractFactory("BDoublon")).deploy();
    if (printLogs) {
        await Console.contractDeploymentInformation("BDoublon", bdoublonContract);
    }
    return bdoublonContract;
}