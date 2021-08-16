import {AuctionTestHelpers} from "../../../helpers/AuctionTestHelpers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {Contract} from "ethers";

describe('[Auction House] function _setTreasuryAddressAndFees', async () => {

    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });

    it('Should fail if not called by the owner', async() => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1Signer);
        await expect(auctionHouseContract._setTreasuryAddressAndFees(guest1Signer.address, 400)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address and his fees', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        await expect(auctionHouseContract._setTreasuryAddressAndFees(treasurySigner.address, 400)).to.emit(auctionHouseContract, "TreasuryAddressAndFeesUpdated").withArgs(treasurySigner.address, 400);
    });
});