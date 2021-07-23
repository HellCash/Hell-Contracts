import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";

export async function deployAuctionHouseIndexer(auctionHouseAddress: string): Promise<Contract> {
    const auctionHouseIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouseIndexer"),{kind: 'uups'});

    await Console.contractDeploymentInformation("AuctionHouseIndexer", auctionHouseIndexerContractProxy);
    console.log('Auction House Indexer: Set Auction House Address to ' + auctionHouseAddress);
    await auctionHouseIndexerContractProxy._setAuctionHouseContract(auctionHouseAddress);
    return auctionHouseIndexerContractProxy;
}