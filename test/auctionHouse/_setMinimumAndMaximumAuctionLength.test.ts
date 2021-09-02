import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function _setMinimumAndMaximumAuctionLength() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setMinimumAndMaximumAuctionLength(BigNumber.from(50), BigNumber.from(150000)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the _minimumAuctionLength and the _maximumAuctionLength', async () => {
        await expect(environment.auctionHouseContract
            ._setMinimumAndMaximumAuctionLength(BigNumber.from(1000), BigNumber.from(120000)))
            .to.emit(environment.auctionHouseContract, "MinimumAndMaximumAuctionLengthUpdated")
            .withArgs(BigNumber.from(1000), BigNumber.from(120000));
    });
}