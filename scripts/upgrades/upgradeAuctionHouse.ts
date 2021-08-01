import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import contractAddresses from "../contractAddresses.json";

export async function deployContracts() {
    console.clear();
    Console.logTitle("Upgrading Auction House Logic");
    await upgrades.upgradeProxy(
        contractAddresses.auctionHouse,
        await ethers.getContractFactory("AuctionHouse")
    );
    console.log('success');
    Console.logHr();
}

deployContracts()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });