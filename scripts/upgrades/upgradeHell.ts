import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import contractAddresses from "../contractAddresses.json";

export async function deployContracts() {
    console.clear();
    Console.logHr();
    console.log("Upgrading Hell Logic")
    await upgrades.upgradeProxy(
        contractAddresses.hell,
        await ethers.getContractFactory("Hell")
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