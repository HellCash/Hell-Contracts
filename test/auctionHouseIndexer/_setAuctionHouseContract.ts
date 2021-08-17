import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";

export function _setAuctionHouseContract() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest1Signer)
            ._setAuctionHouseContract(environment.guest1Signer.address))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Auction House Contract', async () => {
        await expect(environment.auctionHouseIndexerContract
            ._setAuctionHouseContract(environment.masterSigner.address))
            .to.emit(environment.auctionHouseIndexerContract, "AuctionHouseContractUpdated")
            .withArgs(environment.masterSigner.address);
        expect(await environment.auctionHouseIndexerContract._auctionHouseAddress())
            .to.be.equal(environment.masterSigner.address);
    });
}