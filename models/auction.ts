import {BigNumber} from "ethers";

export class Auction {
  id?: BigNumber;
  auctionedTokenAddress?: string;
  auctionedAmount?: BigNumber;
  payingTokenAddress?: string;
  startingPrice?: BigNumber;
  buyoutPrice?: BigNumber;
  endsAtBlock?: number;

  createdAt?: string;
  createdBy?: string;
  // Status variables
  highestBidder?: string;
  highestBid?: BigNumber;
  totalBids?: BigNumber;
  rewardsWithdrawnByWinner?: boolean;
  fundsOrRewardsWithdrawnByCreator?: boolean;
  yourBid?: BigNumber; // Added on responses only
  auctionHouseFee?: number;
}
