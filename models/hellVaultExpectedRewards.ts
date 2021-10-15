import {BigNumber} from "ethers";

export abstract class HellVaultExpectedRewards {
    expectedRewards: BigNumber;
    expectedFee: BigNumber;
    expectedRewardsAfterFees: BigNumber;
}