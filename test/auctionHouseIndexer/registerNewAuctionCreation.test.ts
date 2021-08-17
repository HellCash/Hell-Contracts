import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";
import env from "hardhat";
import {EtherUtils} from "../../utils/ether-utils";

export function registerNewAuctionCreation() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the AH
        await environment.auctionHouseIndexerContract
            ._setAuctionHouseContract(environment.masterSigner.address);
        // Set HELL as trusted
        await environment.auctionHouseIndexerContract
            ._updateTokenTrust(environment.hellContract.address, true);
    });

    it('Should fail if not called by the Auction House', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest1Signer)
            .registerNewAuctionCreation(
                BigNumber.from("15"),  // Auction ID
                environment.masterSigner.address, // Creator Address
                environment.hellContract.address, // Auction Token Address
                EtherUtils.zeroAddress(), // Paid with Token Address
            )).to.be.revertedWith("Forbidden");
    });

    it('Should register new auction creation', async () => {
        const auctionId = BigNumber.from("10");

        const totalTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTokenAuctions(environment.hellContract.address);
        const totalPaidWithTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalPaidWithTokenAuctions(EtherUtils.zeroAddress());
        const userTotalAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalAuctions(environment.masterSigner.address);
        const totalTrustedTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTrustedTokenAuctions();

        await expect(environment.auctionHouseIndexerContract
            .registerNewAuctionCreation(
                auctionId,  // Auction ID
                environment.masterSigner.address, // Creator Address
                environment.hellContract.address, // Auction Token Address
                EtherUtils.zeroAddress(), // Paid with Token Address
            )).to.not.be.reverted;

        const afterTotalTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTokenAuctions(environment.hellContract.address);
        const afterTotalPaidWithTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalPaidWithTokenAuctions(EtherUtils.zeroAddress());
        const afterUserTotalAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._userTotalAuctions(environment.masterSigner.address);
        const afterTotalTrustedTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTrustedTokenAuctions();

        // Verify that totals increased
        expect(totalTokenAuctions.add(1)).to.be.equal(afterTotalTokenAuctions);
        expect(totalPaidWithTokenAuctions.add(1)).to.be.equal(afterTotalPaidWithTokenAuctions);
        expect(userTotalAuctions.add(1)).to.be.equal(afterUserTotalAuctions);
        expect(totalTrustedTokenAuctions.add(1)).to.be.equal(afterTotalTrustedTokenAuctions);
        // Verify that the Auction Id was stored successfully
        expect(await environment.auctionHouseIndexerContract
            ._tokenAuctions(environment.hellContract.address, afterTotalTokenAuctions))
            .to.be.equal(auctionId);
        expect(await environment.auctionHouseIndexerContract
            ._paidWithTokenAuctions(EtherUtils.zeroAddress(), afterTotalPaidWithTokenAuctions))
            .to.be.equal(auctionId);
        expect(await environment.auctionHouseIndexerContract
            ._userAuctions(environment.masterSigner.address, afterUserTotalAuctions))
            .to.be.equal(auctionId);
        expect(await environment.auctionHouseIndexerContract
            ._trustedTokenAuctions(afterTotalTrustedTokenAuctions))
            .to.be.equal(auctionId);
    });

    it('Must not register as trusted Auction if either the Auctioned or Paying Tokens are not trusted', async () => {
        const auctionId = BigNumber.from("11");
        const totalTrustedTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTrustedTokenAuctions();

        await expect(environment.auctionHouseIndexerContract
            .registerNewAuctionCreation(
                auctionId,  // Auction ID
                environment.masterSigner.address, // Creator Address
                environment.doublonContract.address, // Auction Token Address
                EtherUtils.zeroAddress(), // Paid with Token Address
            )).to.not.be.reverted;

        const afterTotalTrustedTokenAuctions: BigNumber = await environment.auctionHouseIndexerContract
            ._totalTrustedTokenAuctions();

        expect(totalTrustedTokenAuctions).to.be.equal(afterTotalTrustedTokenAuctions);
    });
}