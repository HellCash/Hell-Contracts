import {BigNumber, Contract} from "ethers";
import {GreedStarterHelpers} from "../../../helpers/GreedStarterHelpers";
import {formatBytes32String} from "ethers/lib/utils";
import {zeroBytes32} from "../../../utils/ether-utils";

export const predecesor = zeroBytes32;
export const salt = formatBytes32String('25');

export async function callData() {
    const greedStarterIndexer: Contract = await GreedStarterHelpers.getGreedStarterIndexerContract();
    return greedStarterIndexer.interface.encodeFunctionData('_registerTrustedProject',[BigNumber.from(1)]);
}