import {ethers} from "hardhat";
import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {Contract} from "ethers";
import {txConfirmation} from "../../../utils/network-utils";
import {zeroBytes32} from "../../../utils/ether-utils";
import { callData } from "./callData";
import {HellTestHelpers} from "../../../helpers/HellTestHelpers";

async function execute() {
    const masterSigner = (await ethers.getSigners())[0];
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);

    await txConfirmation('Confirm timelock execute', timelockContract.execute(
        hellContract.address, // Target
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