import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";

export async function deployBDoublon(): Promise<Contract> {
    const bdoublonContract = await (await ethers.getContractFactory("BDoublon")).deploy();
    await Console.contractDeploymentInformation("BDoublon", bdoublonContract);
    return bdoublonContract;
}