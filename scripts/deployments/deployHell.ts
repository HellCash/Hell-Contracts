import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";

export async function deployHell(printLogs: boolean = true): Promise<Contract> {
    const hellContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("Hell"),[],
        {kind: 'uups'});
    if (printLogs) {
        Console.contractDeploymentInformation("Hell", hellContractProxy);
    }
    return hellContractProxy;
}