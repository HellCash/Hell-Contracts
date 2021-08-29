import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {txConfirmation} from "../../../utils/network-utils";
import {zeroBytes32} from "../../../utils/ether-utils";
import {GreedStarterHelpers} from "../../../helpers/GreedStarterHelpers";
import {callData} from "./callData";

async function propose() {
    const masterSigner = (await ethers.getSigners())[0];
    const greedStarterIndexer: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);

    const minDelay = await timelockContract.getMinDelay();
    await txConfirmation('Confirm timelock schedule', timelockContract.schedule(
        greedStarterIndexer.address, // Target
        0, // Ether
        await callData(),
        zeroBytes32, // Predecessor
        zeroBytes32, // Salt
        minDelay
    ));
}

propose()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });