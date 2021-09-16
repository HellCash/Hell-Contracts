import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import hellSol from "../../artifacts/contracts/Hell.sol/Hell.json";

export async function deployHell(name: string, symbol: string, printLogs: boolean = true, initializeImplementation: boolean = true): Promise<Contract> {
    const hellContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("Hell"), [name, symbol], {kind: 'uups'});
    if (printLogs) {
        Console.contractDeploymentInformation("Hell", hellContractProxy);
    }

    if (initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(hellSol, hellContractProxy, [
            "HImpl", "HIMPL"
        ], printLogs);
    }

    return hellContractProxy;
}