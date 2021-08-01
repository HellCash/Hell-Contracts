import {ethers, upgrades} from "hardhat";
import {writeFileSync} from "fs";
import {resolve} from "path";
import {Console} from "../utils/console";
import {deployAuctionHouse} from "./deployments/deployAuctionHouse";
import {deployHell} from "./deployments/deployHell";
import {deployHellVault} from "./deployments/deployHellVault";
import {deployDoublon} from "./deployments/deployDoublon";
import {deployBDoublon} from "./deployments/deployBDoublon";
import {deployAuctionHouseIndexer} from "./deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "./deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "./deployments/deployGreedStarterIndexer";
import {deployFUSD} from "./deployments/deployFUSD";

export async function deployContracts(): Promise<boolean> {
    Console.logTitle("Deploying Contracts");
    const accounts = await ethers.provider.listAccounts();
    const treasuryAddress = accounts[4];
    const hellContract = await deployHell();
    console.log('Hell Contract: Exclude Contract Owner from burn list');
    await hellContract._setExcludedFromBurnList(accounts[0], true);

    const hellVaultContract = await deployHellVault(hellContract.address, treasuryAddress);
    console.log('Hell Contract: Set Vault Address');
    await hellContract._setHellVaultAddress(hellVaultContract.address);
    console.log('Hell Contract: Exclude Hell Vault from burn list');
    await hellContract._setExcludedFromBurnList(hellVaultContract.address, true);
    const auctionContract = await deployAuctionHouse(treasuryAddress);
    console.log('Hell Contract: Exclude Auction House from burn list');
    await hellContract._setExcludedFromBurnList(auctionContract.address, true);
    const auctionIndexerContract = await deployAuctionHouseIndexer(auctionContract.address);
    console.log('Auction Contract: Set Indexer to ' + auctionIndexerContract.address);
    await auctionContract._setIndexer(auctionIndexerContract.address);

    const greedStarterContract = await deployGreedStarter(treasuryAddress);
    console.log('Hell Contract: Exclude Greed Starter from burn list');
    await hellContract._setExcludedFromBurnList(greedStarterContract.address, true);
    const greedStarterIndexerContract = await deployGreedStarterIndexer(greedStarterContract.address);
    await greedStarterContract._setIndexer(greedStarterIndexerContract.address);

    // Write Deployment Addresses to JSON storage file
    const addressesData = {
        'hell' : hellContract.address,
        'hellVault': hellVaultContract.address,
        'doublon': (await deployDoublon()).address,
        'bDoublon': (await deployBDoublon()).address,
        'auctionHouse': auctionContract.address,
        'auctionHouseIndexer': auctionIndexerContract.address,
        'greedStarter': greedStarterContract.address,
        'greedStarterIndexer': greedStarterIndexerContract.address,
        'fusd': (await deployFUSD()).address,
    };

    writeFileSync(resolve(__dirname, 'contractAddresses.json'), JSON.stringify(addressesData));
    Console.logHr();
    return true;
}