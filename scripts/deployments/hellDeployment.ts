import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";

export async function deployHell(): Promise<Contract> {
    const accounts = await ethers.provider.listAccounts();
    const hellContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("Hell"),[],
        {kind: 'uups'});

    await Console.contractDeploymentInformation("Hell", hellContractProxy);
    return hellContractProxy;
}