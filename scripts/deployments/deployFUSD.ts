import {Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";

export async function deployFUSD(): Promise<Contract> {
    const fusdContract = await (await ethers.getContractFactory("FUSD")).deploy();
    await Console.contractDeploymentInformation("FUSD", fusdContract);
    return fusdContract;
}