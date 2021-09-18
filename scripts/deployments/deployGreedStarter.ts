import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {BigNumber, Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import greedStarterSol from "../../artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import {defaultDeploymentOptions} from "../../models/deployment-options";
import {EtherUtils} from "../../utils/ether-utils";

export async function deployGreedStarter(hellGovernmentAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const greedStarterProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarter"), [
            hellGovernmentAddress
        ],
        {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("GreedStarter", greedStarterProxy);
    }

    if (deploymentOptions.initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(greedStarterSol, greedStarterProxy, [
            EtherUtils.zeroAddress()
        ], deploymentOptions.printLogs);
    }

    return greedStarterProxy;
}