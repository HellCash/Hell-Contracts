// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
import {Console} from "../utils/console";
import {ethers} from "hardhat";
import {deployHell} from "./deployments/deployHell";
import {deployAuctionHouse} from "./deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "./deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "./deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "./deployments/deployGreedStarterIndexer";
import {writeFileSync} from "fs";
import {resolve} from "path";
import {BigNumber} from "ethers";

async function main() {
    Console.logTitle("Deploying Contracts");
    const accounts = await ethers.provider.listAccounts();
    const treasuryAddress = accounts[1];
    const hellContract = await deployHell();
    console.log('Hell Contract: Exclude Contract Owner from burn list');
    await hellContract._setExcludedFromBurnList(accounts[0], true);
    console.log('Hell Contract: Exclude Treasury Address from burn list');
    await hellContract._setExcludedFromBurnList(accounts[1], true);
    const auctionContract = await deployAuctionHouse(treasuryAddress,
        BigNumber.from(2000),
        800);
    console.log('Hell Contract: Exclude Auction House from burn list');
    await hellContract._setExcludedFromBurnList(auctionContract.address, true);
    const auctionIndexerContract = await deployAuctionHouseIndexer(auctionContract.address);
    console.log('Auction Contract: Set Indexer to ' + auctionIndexerContract.address);
    await auctionContract._setIndexer(auctionIndexerContract.address);

    const greedStarterContract = await deployGreedStarter(1000, treasuryAddress, 800);
    console.log('Hell Contract: Exclude Greed Starter from burn list');
    await hellContract._setExcludedFromBurnList(greedStarterContract.address, true);
    const greedStarterIndexerContract = await deployGreedStarterIndexer(greedStarterContract.address);
    await greedStarterContract._setIndexer(greedStarterIndexerContract.address);

    // Write Deployment Addresses to JSON storage file
    const addressesData = {
        'hell' : hellContract.address,
        'auctionHouse': auctionContract.address,
        'auctionHouseIndexer': auctionIndexerContract.address,
        'greedStarter': greedStarterContract.address,
        'greedStarterIndexer': greedStarterIndexerContract.address,
    };

    writeFileSync(resolve(__dirname, 'liveContractAddresses.json'), JSON.stringify(addressesData));
    Console.logHr();
    return true;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });