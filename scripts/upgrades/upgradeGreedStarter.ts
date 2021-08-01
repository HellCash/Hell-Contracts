import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import contractAddresses from "../contractAddresses.json";

export async function deployContracts() {
    console.clear();
    Console.logHr();
    console.log("Upgrading Greed Starter")
    await upgrades.upgradeProxy(
        contractAddresses.greedStarter,
        await ethers.getContractFactory("GreedStarter")
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