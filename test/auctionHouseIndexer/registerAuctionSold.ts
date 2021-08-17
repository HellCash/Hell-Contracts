import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function registerAuctionSold() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the AH
        await environment.auctionHouseIndexerContract
            ._setAuctionHouseContract(environment.masterSigner.address);
    });

    it('Should fail if not called by the Auction House', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest1Signer)
            .registerAuctionSold(
                BigNumber.from("5"),  // Auction ID
                environment.guest2Signer.address, // Creator Address
            )).to.be.revertedWith("Forbidden");
    });

    let auctionId: BigNumber;
    let creatorUserAddress: string;
    it('Should register user sale', async() => {
        auctionId = BigNumber.from("10");
        creatorUserAddress = environment.guest2Signer.address;
        // Expect that the Auction wasn't registered as sold
        expect(await environment.auctionHouseIndexerContract.
        _userSoldAuction(creatorUserAddress, auctionId)).to.be.false;

        const userTotalAuctionsSold: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsSold(creatorUserAddress);

        await expect(environment.auctionHouseIndexerContract
            .registerAuctionSold(
                auctionId,  // Auction ID
                creatorUserAddress, // Creator Address
            )).to.not.be.reverted;

        const afterUserTotalAuctionsSold = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsSold(creatorUserAddress);

        expect(userTotalAuctionsSold.add(1)).to.be.equal(afterUserTotalAuctionsSold);
        expect(await environment.auctionHouseIndexerContract.
        _userSoldAuction(creatorUserAddress,auctionId)).to.be.true;
    });

    it('Should register user sales only once', async () => {
        const userTotalAuctionsSold = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsSold(creatorUserAddress);

        await expect(environment.auctionHouseIndexerContract
            .registerAuctionSold(
                auctionId,  // Auction ID
                creatorUserAddress, // Creator Address
            )).to.not.be.reverted;

        const afterUserTotalAuctionsSold = await environment.auctionHouseIndexerContract
            ._userTotalAuctionsSold(creatorUserAddress);

        expect(userTotalAuctionsSold).to.be.equal(afterUserTotalAuctionsSold);
    });

}