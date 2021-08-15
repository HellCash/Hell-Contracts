import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";

export async function deployAuctionHouseIndexer(auctionHouseAddress: string, printLogs: boolean = true): Promise<Contract> {
    const auctionHouseIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouseIndexer"),{kind: 'uups'});
    if (printLogs) {
        await Console.contractDeploymentInformation("AuctionHouseIndexer", auctionHouseIndexerContractProxy);
        console.log('Auction House Indexer: Set Auction House Address to ' + auctionHouseAddress);
    }
    await auctionHouseIndexerContractProxy._setAuctionHouseContract(auctionHouseAddress);
    return auctionHouseIndexerContractProxy;
}