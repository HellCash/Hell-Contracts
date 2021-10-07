import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {parseEther} from "ethers/lib/utils";
import {EtherUtils} from "../../utils/etherUtils";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

export function _forceEndAuction() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    let auctionId: BigNumber;
    before(async () => {
        await environment.initialize();
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        const auctionedAmount: BigNumber = parseEther('10');
        environment.hellContract.approve(environment.auctionHouseContract.address, auctionedAmount)
        await environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            auctionedAmount, // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            parseEther('2'), // Starting Bid Price
            parseEther('25'), // Buyout price
            environment.minimumAuctionLength.mul(2)
                .add(await ethers.provider.getBlockNumber()));
        auctionId = currentTotalAuctions.add(1);
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._forceEndAuction(auctionId))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should forcefully close the Auction', async () => {
        await expect(environment.auctionHouseContract
            ._forceEndAuction(auctionId))
            .to.emit(environment.auctionHouseContract, "AuctionClosedByAdmin")
            .withArgs(auctionId);
    });
}