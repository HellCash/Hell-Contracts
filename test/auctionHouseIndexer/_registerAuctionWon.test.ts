import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function _registerAuctionWon() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the AH
        await environment.auctionHouseIndexerContract
            ._setAuctionHouseContract(environment.masterSigner.address);
    });

    it('Should fail if not called by the Auction House', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest2Signer)
            ._registerAuctionWon(
                BigNumber.from("5"),  // Auction ID
                environment.guest3Signer.address, // Creator Address
            )).to.be.revertedWith("Forbidden");
    });

    let auctionId: BigNumber;
    let winnerUserAddress: string;
    it("Should register user's victory", async() => {
        auctionId = BigNumber.from("15");
        winnerUserAddress = environment.guest3Signer.address;
        // Expect that the Auction wasn't registered as Won
        expect(await environment.auctionHouseIndexerContract.
        _userWonTheAuction(winnerUserAddress, auctionId)).to.be.false;

        const userTotalAuctionsWon: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsWon(winnerUserAddress);

        await expect(environment.auctionHouseIndexerContract
            ._registerAuctionWon(
                auctionId,  // Auction ID
                winnerUserAddress, // Creator Address
            )).to.not.be.reverted;

        const afterUserTotalAuctionsWon = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsWon(winnerUserAddress);

        expect(userTotalAuctionsWon.add(1)).to.be.equal(afterUserTotalAuctionsWon);
        expect(await environment.auctionHouseIndexerContract.
        _userWonTheAuction(winnerUserAddress, auctionId)).to.be.true;
    });

    it("Should register user's victory only once", async () => {
        const userTotalAuctionsWon = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsWon(winnerUserAddress);

        await expect(environment.auctionHouseIndexerContract
            ._registerAuctionWon(
                auctionId,  // Auction ID
                winnerUserAddress, // Creator Address
            )).to.not.be.reverted;

        const afterUserTotalAuctionsWon = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsWon(winnerUserAddress);

        expect(userTotalAuctionsWon).to.be.equal(afterUserTotalAuctionsWon);
    });

}