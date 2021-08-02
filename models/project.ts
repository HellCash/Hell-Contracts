import {BigNumber} from 'ethers';

export abstract class Project {
  id: BigNumber;
  tokenAddress: string;
  paidWith: string;
  startingBlock: BigNumber;
  endsAtBlock: BigNumber;
  pricePerToken: BigNumber;
  totalTokens: BigNumber;
  totalSold: BigNumber;
  rewardsCollected: BigNumber;
  minimumPurchase: BigNumber;
  maximumPurchase: BigNumber;
  createdBy: string;
}
