import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";

export async function deployDoublon(): Promise<Contract> {
    const doublonContract = await (await ethers.getContractFactory("Doublon")).deploy();
    await Console.contractDeploymentInformation("Doublon", doublonContract);
    return doublonContract;
}