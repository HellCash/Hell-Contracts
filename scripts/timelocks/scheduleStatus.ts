import {ethers} from "hardhat";
import {TimelockControllerHelpers} from "../../helpers/TimelockControllerHelpers";
import {Contract} from "ethers";

export async function scheduleStatus() {
    const masterSigner = (await ethers.getSigners())[0];
    const operationHexId = '0x8e71c31172b508be5014253769662bc4e2ade1d97d5900a3b2e4562ae2deddf7';
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);
    console.log('valid operation: ' + await timelockContract.isOperation(operationHexId));
    console.log('pending: ' + await timelockContract.isOperationPending(operationHexId));
    console.log('ready: ' + await timelockContract.isOperationReady(operationHexId));
    console.log('done: ' + await timelockContract.isOperationDone(operationHexId));
}

scheduleStatus()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });