import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function _setMinimumAuctionLength() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setMinimumAuctionLength(BigNumber.from(50)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update minimumAuctionLength', async () => {
        await expect(environment.auctionHouseContract
            ._setMinimumAuctionLength(BigNumber.from(1000)))
            .to.emit(environment.auctionHouseContract, "MinimumAuctionLengthUpdated")
            .withArgs(BigNumber.from(1000));
    });
}