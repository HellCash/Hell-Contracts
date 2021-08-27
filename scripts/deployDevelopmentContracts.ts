import {ethers, hardhatArguments} from "hardhat";
import {writeFileSync} from "fs";
import {resolve} from "path";
import {Console} from "../utils/console";
import {deployAuctionHouse} from "./deployments/deployAuctionHouse";
import {deployHell} from "./deployments/deployHell";
import {deployDoublon} from "./deployments/deployDoublon";
import {deployBDoublon} from "./deployments/deployBDoublon";
import {deployAuctionHouseIndexer} from "./deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "./deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "./deployments/deployGreedStarterIndexer";
import {deployFUSD} from "./deployments/deployFUSD";
import {BigNumber, Contract} from "ethers";
import {txConfirmation} from "../utils/network-utils";
import {deployTimelock} from "./deployments/deployTimelock";

async function deployDevelopmentContracts() {
    Console.logTitle("Deploying Contracts");
    const accounts = await ethers.provider.listAccounts();
    const treasuryAddress = accounts[1];
    const hellContract = await deployHell();
    await txConfirmation('[Hell Contract]: Exclude Owner from burn list',
        hellContract._setExcludedFromBurnList(accounts[0], true));
    await txConfirmation('[Hell Contract]: Exclude treasuryAddress from burn list',
        hellContract._setExcludedFromBurnList(treasuryAddress, true));

    const auctionContract = await deployAuctionHouse(treasuryAddress, BigNumber.from(2000), 800);
    await txConfirmation('[Hell Contract]: Exclude Auction House from burn list',
        hellContract._setExcludedFromBurnList(auctionContract.address, true));

    const auctionIndexerContract = await deployAuctionHouseIndexer(auctionContract.address);
    await txConfirmation('[Auction House Contract]: Set Indexer to ' + auctionIndexerContract.address,
        auctionContract._setIndexer(auctionIndexerContract.address));

    const greedStarterContract = await deployGreedStarter(1000, treasuryAddress, 800);
    await txConfirmation('[Hell Contract]: Exclude Greed Starter from burn list',
        hellContract._setExcludedFromBurnList(greedStarterContract.address, true));

    const greedStarterIndexerContract = await deployGreedStarterIndexer(greedStarterContract.address);
    await txConfirmation('[Greed Starter Contract]: Set Indexer to' + greedStarterIndexerContract.address,
        greedStarterContract._setIndexer(greedStarterIndexerContract.address));

    const timelockContract: Contract = await deployTimelock(10);
    await txConfirmation('[Hell Contract]: give ownership to timelock',
        hellContract.transferOwnership(timelockContract.address));
    await txConfirmation('[Auction House Contract]: give ownership to timelock',
        auctionContract.transferOwnership(timelockContract.address));
    await txConfirmation('[Auction House Indexer Contract]: give ownership to timelock',
        auctionIndexerContract.transferOwnership(timelockContract.address));
    await txConfirmation('[Greed Starter Contract]: give ownership to timelock',
        greedStarterContract.transferOwnership(timelockContract.address));
    await txConfirmation('[Greed Starter Indexer Contract]: give ownership to timelock',
        greedStarterIndexerContract.transferOwnership(timelockContract.address));

    // Write Deployment Addresses to JSON storage file
    const addressesData = {
        'hell' : hellContract.address,
        'doublon': (await deployDoublon()).address,
        'bDoublon': (await deployBDoublon()).address,
        'auctionHouse': auctionContract.address,
        'auctionHouseIndexer': auctionIndexerContract.address,
        'greedStarter': greedStarterContract.address,
        'greedStarterIndexer': greedStarterIndexerContract.address,
        'fusd': (await deployFUSD()).address,
        'timelockContract': timelockContract.address,
    };

    writeFileSync(resolve(__dirname, `${hardhatArguments.network}-contract-addresses.json`), JSON.stringify(addressesData));
    Console.logHr();
    return true;
}

deployDevelopmentContracts()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });