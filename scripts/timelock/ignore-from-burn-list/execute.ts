import {ethers} from "hardhat";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {Contract} from "ethers";
import {txConfirmation} from "../../../utils/network-utils";
import {zeroBytes32} from "../../../utils/ether-utils";
import { callData } from "./callData";
import {HellTestHelpers} from "../../../helpers/HellTestHelpers";
import {ErrorHandler} from "../../../utils/error-handler";

async function execute() {
    const masterSigner = (await ethers.getSigners())[0];
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);

    try {
        await txConfirmation('Confirm timelock execute', timelockContract.execute(
            hellContract.address, // Target
            0, // Ether
            await callData(),
            zeroBytes32, // Predecessor
            zeroBytes32, // Salt
        ));
    } catch (e) {
        console.log(ErrorHandler.getMessage(e));
        const id = await timelockContract.hashOperation(
            hellContract.address,
            0,
            await callData(),
            zeroBytes32,
            zeroBytes32
        );
        console.log('\tMin Delay = ' + await timelockContract.getMinDelay());
        console.log('\tTimestamp = ' + await timelockContract.getTimestamp(id));
        console.log('\tIs Operation = ' + await timelockContract.isOperation(id));
        console.log('\tIs Pending = ' + await timelockContract.isOperationPending(id));
        console.log('\tIs Ready = ' + await timelockContract.isOperationReady(id));
        console.log('\tIs Done = ' + await timelockContract.isOperationDone(id));
        console.log('\tTimelock is the Owner = ' + await timelockContract.address == await hellContract.owner());
    }
}

execute()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });