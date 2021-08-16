import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {BigNumber, Contract} from "ethers";

export async function deployGreedStarter(minimumProjectLength: number = 1000, treasuryAddress: string, treasuryFees: number, printLogs: boolean = true): Promise<Contract> {
    const greedStarterProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("GreedStarter"), [
            BigNumber.from(minimumProjectLength),
            treasuryAddress,
            treasuryFees
        ],
        {kind: 'uups'});
    if (printLogs) {
        await Console.contractDeploymentInformation("GreedStarter", greedStarterProxy);
    }
    return greedStarterProxy;
}