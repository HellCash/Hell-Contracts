import {ethers, upgrades} from "hardhat";
import {Contract} from "ethers";
import {Console} from "../../utils/console";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployAuctionHouse(hellGovernmentAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const auctionHouseContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouse"), [
            hellGovernmentAddress
        ],
        {kind: 'uups'}
    );
    if (deploymentOptions.printLogs) {
        Console.contractDeploymentInformation("AuctionHouse", auctionHouseContractProxy);
    }

    return auctionHouseContractProxy;
}