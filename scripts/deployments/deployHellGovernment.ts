import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {BigNumber, Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import HellGovernmentSol from "../../artifacts/contracts/HellGovernment.sol/HellGovernment.json";
import {HellGovernmentInitializer} from "../../models/hell-government-initializer";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployHellGovernment(hellGovernmentInitializer: HellGovernmentInitializer, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const hellGovernmentContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("HellGovernment"), [
            hellGovernmentInitializer.treasuryAddress,
            hellGovernmentInitializer.auctionHouseFee,
            hellGovernmentInitializer.minimumAuctionLength,
            hellGovernmentInitializer.maximumAuctionLength,
            hellGovernmentInitializer.greedStarterFee,
            hellGovernmentInitializer.minimumProjectLength,
            hellGovernmentInitializer.maximumProjectLength,
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        Console.contractDeploymentInformation("HellGovernment", hellGovernmentContractProxy);
    }

    if (deploymentOptions.initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(HellGovernmentSol, hellGovernmentContractProxy, [
            hellGovernmentInitializer.treasuryAddress,
            1,
            BigNumber.from(1),
            BigNumber.from(1),
            1,
            BigNumber.from(1),
            BigNumber.from(1),
        ], deploymentOptions.printLogs);
    }

    return hellGovernmentContractProxy;
}