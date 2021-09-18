import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import hellSol from "../../artifacts/contracts/Hell.sol/Hell.json";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployHell(name: string, symbol: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("Hell"), [name, symbol], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        Console.contractDeploymentInformation("Hell", hellContractProxy);
    }

    if (deploymentOptions.initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(hellSol, hellContractProxy, [
            "HImpl", "HIMPL"
        ], deploymentOptions.printLogs);
    }

    return hellContractProxy;
}