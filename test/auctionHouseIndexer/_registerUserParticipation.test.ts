import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function _registerUserParticipation() {
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
            ._registerUserParticipation(
                BigNumber.from("5"),  // Auction ID
                environment.masterSigner.address, // Participant Address
            )).to.be.revertedWith("Forbidden");
    });

    let participantUserAddress: string;
    let participatedAuctionId: BigNumber;
    it('Should register user participation', async() => {
        participantUserAddress = environment.guest1Signer.address;
        participatedAuctionId = BigNumber.from("5");
        // Expect that the user had never participated before
        expect(await environment.auctionHouseIndexerContract.
        _userParticipatedInAuction(participantUserAddress,participatedAuctionId)).to.be.false;

        const userTotalParticipatedAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalParticipatedAuctions(participantUserAddress);

        await expect(environment.auctionHouseIndexerContract
            ._registerUserParticipation(
                participatedAuctionId,
                participantUserAddress,
            )).to.not.be.reverted;

        const afterUserTotalParticipatedAuctions = await environment.auctionHouseIndexerContract
            ._userTotalParticipatedAuctions(participantUserAddress);

        expect(userTotalParticipatedAuctions.add(1)).to.be.equal(afterUserTotalParticipatedAuctions);

        expect(await environment.auctionHouseIndexerContract
            ._userParticipatedAuctions(participantUserAddress, afterUserTotalParticipatedAuctions))
            .to.be.equal(participatedAuctionId);

        expect(await environment.auctionHouseIndexerContract.
        _userParticipatedInAuction(participantUserAddress,participatedAuctionId)).to.be.true;
    });

    it('Should register user participation only once per Auction', async() => {
        const userTotalParticipatedAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalParticipatedAuctions(participantUserAddress);

        await environment.auctionHouseIndexerContract
            ._registerUserParticipation(
                participatedAuctionId,
                participantUserAddress,
            );

        const afterUserTotalParticipatedAuctions = await environment.auctionHouseIndexerContract
            ._userTotalParticipatedAuctions(participantUserAddress);

        expect(userTotalParticipatedAuctions).to.be.equal(afterUserTotalParticipatedAuctions);
    });

}