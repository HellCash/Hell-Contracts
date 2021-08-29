import {BigNumber, Contract} from "ethers";
import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";

export async function callData() {
    const auctionContract: Contract = await AuctionTestHelpers.getAuctionContract();
    return auctionContract.interface.encodeFunctionData(
        '_setMinimumAuctionLength',
        [BigNumber.from(350)]);
}