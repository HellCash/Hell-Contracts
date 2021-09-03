import {BigNumber, Contract} from "ethers";
import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";
import {HellTestHelpers} from "../../../helpers/HellTestHelpers";

export async function callData() {
    const hellContract: Contract = await HellTestHelpers.getHellContract();
    return hellContract.interface.encodeFunctionData(
        '_setExcludedFromBurnList',
        ['0xC17773BcE74E471e0eeaEae8fb5888d63b52Fa81', true]);
}