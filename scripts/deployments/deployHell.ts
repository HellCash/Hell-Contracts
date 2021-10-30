import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {BigNumber, Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployHell(name: string, symbol: string, initialSupply: BigNumber, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("Hell"), [
            name,
            symbol,
            initialSupply
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        Console.contractDeploymentInformation("Hell", hellContractProxy);
    }
    return hellContractProxy;
}