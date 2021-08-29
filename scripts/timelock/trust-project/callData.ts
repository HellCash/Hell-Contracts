import {BigNumber, Contract} from "ethers";
import {GreedStarterHelpers} from "../../../helpers/GreedStarterHelpers";

export async function callData() {
    const greedStarterIndexer: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract();
    return greedStarterIndexer.interface.encodeFunctionData(
        '_registerTrustedProject',
        [BigNumber.from(1)]);
}