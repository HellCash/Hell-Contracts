import {BigNumber, Contract} from "ethers";
import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";
import {HellTestHelpers} from "../../../helpers/HellTestHelpers";

export async function callData() {
    const hellContract: Contract = await HellTestHelpers.getHellContract();
    return hellContract.interface.encodeFunctionData(
        '_setExcludedFromBurnList',
        ['0xC5B3F5a3431Ab036B422f860e2e82234aa76C4b6', true]);
}