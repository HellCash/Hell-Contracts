import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import {EtherUtils} from "../../utils/ether-utils";

export async function deployAuctionHouseIndexer(auctionHouseAddress: string, printLogs: boolean = true): Promise<Contract> {
    const auctionHouseIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouseIndexer"), [
            auctionHouseAddress
        ], {kind: 'uups'});
    if (printLogs) {
        await Console.contractDeploymentInformation("AuctionHouseIndexer", auctionHouseIndexerContractProxy);
        console.log('\t[Auction House Indexer Contact]: Set Auction House Address to ' + auctionHouseAddress);
    }

    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    await ContractUtils.initializeImplementation(auctionHouseIndexerSol, auctionHouseIndexerContractProxy, [
        EtherUtils.zeroAddress()
    ], printLogs);

    return auctionHouseIndexerContractProxy;
}