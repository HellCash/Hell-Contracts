import {BigNumber} from "ethers";

export abstract class HellGovernmentInitializer {
    treasuryAddress: string;
    auctionHouseFee: number | BigNumber;
    minimumAuctionLength: BigNumber;
    maximumAuctionLength: BigNumber;
    greedStarterFee: number | BigNumber;
    minimumProjectLength: BigNumber;
    maximumProjectLength: BigNumber;
    hellVaultTreasuryFee: number | BigNumber;
    hellVaultCompounderFee: number | BigNumber;
}