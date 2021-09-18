import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import greedStarterIndexerSol from "../../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";
import {EtherUtils} from "../../utils/ether-utils";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployGreedStarterIndexer(hellGovernmentAddress: string, greedStarterContractAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const greedStarterIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarterIndexer"), [
            hellGovernmentAddress,
            greedStarterContractAddress
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("GreedStarterIndexer", greedStarterIndexerContractProxy);
    }

    if (deploymentOptions.initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(greedStarterIndexerSol, greedStarterIndexerContractProxy, [
            EtherUtils.zeroAddress(),
        ], deploymentOptions.printLogs);
    }

    return greedStarterIndexerContractProxy;
}