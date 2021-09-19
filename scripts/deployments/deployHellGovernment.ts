import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
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

    return hellGovernmentContractProxy;
}