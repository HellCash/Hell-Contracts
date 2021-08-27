import {ethers} from "hardhat";
import {Console} from "../../utils/console";

export async function deployTimelock(delayInSeconds: number, printLogs: boolean = true) {
    const masterSigner = (await ethers.getSigners())[0];
    const timelockContract = await (await ethers.getContractFactory("TimelockController"))
        .deploy(delayInSeconds, [masterSigner.address], [masterSigner.address]);
    if (printLogs) {
        await Console.contractDeploymentInformation("TimelockController", timelockContract);
    }
    return timelockContract;
}