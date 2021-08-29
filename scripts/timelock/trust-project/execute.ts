import {ethers} from "hardhat";
import {Contract} from "ethers";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {txConfirmation} from "../../../utils/network-utils";
import {GreedStarterHelpers} from "../../../helpers/GreedStarterHelpers";
import {callData, predecesor, salt} from "./callData";
import {ErrorHandler} from "../../../utils/error-handler";

async function execute() {
    const masterSigner = (await ethers.getSigners())[0];
    const greedStarterIndexer: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);
    try {
        await txConfirmation('\tConfirm timelock execute', timelockContract.execute(
            greedStarterIndexer.address, // Target
            0, // Ether
            await callData(),
            predecesor, // Predecessor
            salt, // Salt
        ));
    } catch (e) {
        console.log(ErrorHandler.getMessage(e));
        const id = await timelockContract.hashOperation(
            greedStarterIndexer.address,
            0,
            await callData(),
            predecesor
            ,salt);
        console.log('\tMin Delay = ' + await timelockContract.getMinDelay());
        console.log('\tTimestamp = ' + await timelockContract.getTimestamp(id));
        console.log('\tIs Operation = ' + await timelockContract.isOperation(id));
        console.log('\tIs Pending = ' + await timelockContract.isOperationPending(id));
        console.log('\tIs Ready = ' + await timelockContract.isOperationReady(id));
        console.log('\tIs Done = ' + await timelockContract.isOperationDone(id));
        console.log('\tTimelock is the Owner = ' + await timelockContract.address == await greedStarterIndexer.owner());
    }

}

execute()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });