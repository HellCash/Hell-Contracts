import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {Contract} from "ethers";

describe('[Auction House Indexer] function _setAuctionHouseContract', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    let auctionHouseContract: Contract;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        auctionHouseContract = await AuctionTestHelpers.getAuctionContract();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });

    it('Should fail if not called by the owner', async() => {
        const auctionHouseIndexerContract: Contract = await AuctionTestHelpers.getAuctionIndexer(guest1Signer);
        await expect(auctionHouseIndexerContract._setAuctionHouseContract(auctionHouseContract.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address and his fees', async () => {
        const auctionHouseIndexerContract: Contract = await AuctionTestHelpers.getAuctionIndexer(masterSigner);
        await expect(auctionHouseIndexerContract._setAuctionHouseContract(auctionHouseContract.address)).to.emit(auctionHouseIndexerContract, "AuctionHouseContractUpdated")
            .withArgs(auctionHouseContract.address);
    });
});