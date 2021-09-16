import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {BigNumber, Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import greedStarterSol from "../../artifacts/contracts/GreedStarter.sol/GreedStarter.json";

export async function deployGreedStarter(minimumProjectLength: number = 1000, treasuryAddress: string, treasuryFees: number, printLogs: boolean = true): Promise<Contract> {
    const greedStarterProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarter"), [
            BigNumber.from(minimumProjectLength),
            treasuryAddress,
            treasuryFees
        ],
        {kind: 'uups'});
    if (printLogs) {
        await Console.contractDeploymentInformation("GreedStarter", greedStarterProxy);
    }

    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    await ContractUtils.initializeImplementation(greedStarterSol, greedStarterProxy, [
        BigNumber.from(999999999999999),
        treasuryAddress,
        BigNumber.from(1),
    ], printLogs);

    return greedStarterProxy;
}