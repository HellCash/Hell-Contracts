import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";

export function _updateTokenTrust() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest1Signer)
            ._updateTokenTrust(environment.doublonContract.address, true))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update token trust', async() => {
        // Expect that the token isn't trusted yet
        expect(await environment.auctionHouseIndexerContract
            ._tokenIsTrusted(environment.hellContract.address)).to.be.false;

        // Set as trusted
        await expect(environment.auctionHouseIndexerContract
            ._updateTokenTrust(environment.hellContract.address, true))
            .to.emit(environment.auctionHouseIndexerContract, "UpdatedTokenTrust")
            .withArgs(environment.hellContract.address, true);

        // Expect that it was correctly marked as trusted.
        expect(await environment.auctionHouseIndexerContract
            ._tokenIsTrusted(environment.hellContract.address)).to.be.true;

        // Set as untrusted again
        await expect(environment.auctionHouseIndexerContract
            ._updateTokenTrust(environment.hellContract.address, false))
            .to.emit(environment.auctionHouseIndexerContract, "UpdatedTokenTrust")
            .withArgs(environment.hellContract.address, false);

        // Expect that it was correctly marked as untrusted.
        expect(await environment.auctionHouseIndexerContract
            ._tokenIsTrusted(environment.hellContract.address)).to.be.false;
    });

}