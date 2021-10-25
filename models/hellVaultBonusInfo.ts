import {BigNumber} from "ethers";

export class HellVaultBonusInfo {
    id: BigNumber;
    tokenAddress: string;
    totalAmount: BigNumber;
    rewardPerBlock: BigNumber;
    startingBlock: BigNumber;
    amountAvailable: BigNumber;
}