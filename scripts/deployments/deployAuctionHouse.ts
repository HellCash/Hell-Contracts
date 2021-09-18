import {ethers, upgrades} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {Console} from "../../utils/console";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import {ContractUtils} from "../../utils/contract-utils";
import {defaultDeploymentOptions} from "../../models/deployment-options";
import {EtherUtils} from "../../utils/ether-utils";

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