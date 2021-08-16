import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {deployAuctionHouse} from "../scripts/deployments/deployAuctionHouse";
import {deployHell} from "../scripts/deployments/deployHell";
import {deployAuctionHouseIndexer} from "../scripts/deployments/deployAuctionHouseIndexer";
import {createAuction} from "./auctionHouse/createAuction.test";



describe('[Auction House]',() => {
    describe('createAuction', createAuction);
});