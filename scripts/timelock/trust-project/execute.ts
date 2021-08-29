import {ethers} from "hardhat";
import {Contract} from "ethers";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {txConfirmation} from "../../../utils/network-utils";
import {zeroBytes32} from "../../../utils/ether-utils";
import {GreedStarterHelpers} from "../../../helpers/GreedStarterHelpers";
import {callData} from "./callData";

async function execute() {
    const masterSigner = (await ethers.getSigners())[0];
    const greedStarterIndexer: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);
    await txConfirmation('Confirm timelock schedule', timelockContract.execute(
        greedStarterIndexer.address, // Target
        0, // Ether
        await callData(),
        zeroBytes32, // Predecessor
        zeroBytes32, // Salt
    ));
}

execute()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });