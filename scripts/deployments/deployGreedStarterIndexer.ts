import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import greedStarterIndexerSol from "../../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";
import {EtherUtils} from "../../utils/ether-utils";

export async function deployGreedStarterIndexer(greedStarterContractAddress: string, printLogs: boolean = true): Promise<Contract> {
    const greedStarterIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarterIndexer"), [greedStarterContractAddress], {kind: 'uups'});
    if (printLogs) {
        await Console.contractDeploymentInformation("GreedStarterIndexer", greedStarterIndexerContractProxy);
    }

    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    await ContractUtils.initializeImplementation(greedStarterIndexerSol, greedStarterIndexerContractProxy, [
        EtherUtils.zeroAddress(),
    ], printLogs);

    return greedStarterIndexerContractProxy;
}