import {BigNumber} from "ethers";
import {ClaimMode} from "../enums/claimMode";

export abstract class HellVaultUserInfo {
    hellDeposited: BigNumber; // The Amount of Hell that the user Staked inside the HellVault
    lastDividendBlock: BigNumber; // Last block since the user claimed his rewards
    distributedDividendsSinceLastPayment: BigNumber[]; // Dividends data since the last deposit
    claimMode: ClaimMode;
    // Used on responses only
    hellRewarded: BigNumber;
    hellRewardWithdrawFee: BigNumber;
}