import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";

export function _setIndexer() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setIndexer(environment.guest1Signer.address))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the indexer', async () => {
        await expect(environment.auctionHouseContract._setIndexer(environment.auctionHouseIndexerContract.address))
            .to.emit(environment.auctionHouseContract, "AuctionHouseIndexerUpdated")
            .withArgs(environment.auctionHouseIndexerContract.address);
    });
}