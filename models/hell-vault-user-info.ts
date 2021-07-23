import {BigNumber} from "ethers";

export class HellVaultUserInfo {
  hellDeposited?: BigNumber;
  lastDividendBlock?: BigNumber;
  distributedDividendsSinceLastPayment?: BigNumber[];
  hellRewarded?: BigNumber;
  hellRewardWithdrawFee?: BigNumber;
}
