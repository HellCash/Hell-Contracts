import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";

export function _setTreasuryAddressAndFees() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setTreasuryAddressAndFees(environment.guest1Signer.address, 400))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address and his fees', async () => {
        await expect(environment.auctionHouseContract._setTreasuryAddressAndFees(environment.treasurySigner.address, 400))
            .to.emit(environment.auctionHouseContract, "TreasuryAddressAndFeesUpdated")
            .withArgs(environment.treasurySigner.address, 400);
    });
}