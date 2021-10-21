import {BigNumber} from "ethers";

export abstract class HellVaultExpectedRewards {
    expectedRewards: BigNumber;
    expectedTreasuryFee: BigNumber;
    expectedCompounderFee: BigNumber;
    expectedRewardsAfterFees: BigNumber;
}