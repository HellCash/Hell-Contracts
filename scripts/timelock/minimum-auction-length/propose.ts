import {ethers} from "hardhat";
import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";
import {TimelockControllerHelpers} from "../../../helpers/TimelockControllerHelpers";
import {Contract} from "ethers";
import {txConfirmation} from "../../../utils/network-utils";
import {zeroBytes32} from "../../../utils/ether-utils";
import { callData } from "./callData";

async function propose() {
    const masterSigner = (await ethers.getSigners())[0];
    const auctionContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
    const timelockContract: Contract = await TimelockControllerHelpers.getTimelockControllerContract(masterSigner);
    const minDelay = await timelockContract.getMinDelay();

    await txConfirmation('Confirm timelock schedule', timelockContract.schedule(
        auctionContract.address, // Target
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