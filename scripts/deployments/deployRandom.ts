import {BigNumber, Contract} from "ethers";
import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";

export async function deployRandom(amountToMint: BigNumber, printLogs: boolean = true): Promise<Contract> {
    const randomContract = await (await ethers.getContractFactory("Random")).deploy(amountToMint);
    if (printLogs) {
        await Console.contractDeploymentInformation("RANDOM", randomContract);
    }
    return randomContract;
}