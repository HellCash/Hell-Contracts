import {Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import contractAddresses from "../scripts/contractAddresses.json";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import {Auction} from "../models/auction";
import {parseEther} from "ethers/lib/utils";

export class AuctionTestHelpers {
    static async getAuctionContract(accountSigner?: Signer): Promise<any> {
        return ethers.getContractAt(auctionHouseSol.abi, contractAddresses.auctionHouse, accountSigner);
    }

    static async getAuctionIndexer(accountSigner?: Signer): Promise<any> {
        return ethers.getContractAt(auctionHouseIndexerSol.abi, contractAddresses.auctionHouseIndexer, accountSigner);
    }

    static async createAuction(accountSigner: Signer, auction: Auction): Promise<any> {
        const contract = await this.getAuctionContract();
        return await contract.createAuction(auction);
    }

    static async createTestAuction(): Promise<any> {
        const signers = await ethers.getSigners();
        const contract = await this.getAuctionContract(signers[0]);
        let blockNumber = await ethers.provider.getBlockNumber();

        return contract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("1000"), // 1000 Doublons
            contractAddresses.hell, // Sell against Hell
            parseEther("10"), // Starting Price of 10 Hell
            parseEther("15"), // Buyout Price 15 Hell
            blockNumber + 4100);

        // return contract.createAuction(
        //     contractAddresses.doublon, // Auction Hell
        //     parseEther("1000"),
        //     EtherUtils.zeroAddress(), // Sell against BNB
        //     parseEther("1"),
        //     parseEther("5"),
        //     blockNumber + 4100);

        // return contract.createAuction(
        //     contractAddresses.hell, // Auction Hell
        //     parseEther("0.025"),
        //     EtherUtils.zeroAddress(), // Sell against BNB
        //     parseEther("1"),
        //     parseEther("5"),
        //     blockNumber + 4300);
    }

}