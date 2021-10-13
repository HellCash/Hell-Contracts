import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {HellGovernmentInitializer} from "../../models/hellGovernmentInitializer";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

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
            hellGovernmentInitializer.hellVaultTreasuryFee
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        Console.contractDeploymentInformation("HellGovernment", hellGovernmentContractProxy);
    }

    return hellGovernmentContractProxy;
}