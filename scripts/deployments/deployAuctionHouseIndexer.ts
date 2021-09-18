import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import {EtherUtils} from "../../utils/ether-utils";
import {defaultDeploymentOptions} from "../../models/deployment-options";

export async function deployAuctionHouseIndexer(hellGovernmentAddress: string, auctionHouseAddress: string, deploymentOptions = defaultDeploymentOptions): Promise<Contract> {
    const auctionHouseIndexerContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouseIndexer"), [
            hellGovernmentAddress,
            auctionHouseAddress
        ], {kind: 'uups'});
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("AuctionHouseIndexer", auctionHouseIndexerContractProxy);
        console.log('\t[Auction House Indexer Contract]: Set Auction House Address to ' + auctionHouseAddress);
        console.log('\t[Auction House Indexer Contract]: Set Hell Government Address to ' + hellGovernmentAddress);
    }

    if (deploymentOptions.initializeImplementation) {
        // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
        // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
        await ContractUtils.initializeProxyImplementation(auctionHouseIndexerSol, auctionHouseIndexerContractProxy, [
            EtherUtils.zeroAddress(),
            EtherUtils.zeroAddress()
        ], deploymentOptions.printLogs);
    }

    return auctionHouseIndexerContractProxy;
}