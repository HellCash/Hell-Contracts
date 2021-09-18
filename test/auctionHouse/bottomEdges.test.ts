// Test a whole Auction using the lowest possible values
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {parseUnits} from "ethers/lib/utils";
import {Auction} from "../../models/auction";

export function bottomEdges() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
        await environment.fusdContract.transfer(environment.guest2Signer.address, parseUnits('1', 6));
    });

    let auctionId: BigNumber;
    it('HELL/FUSD: Create an auction with Starting price, Auctioned amount, Buyout price of 1 wei', async ()  => {
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        const auctionLength = environment.minimumAuctionLength.mul(2)
            .add(await ethers.provider.getBlockNumber());
        // Define variables
        const auctionedAmount = BigNumber.from(1);
        const bidPrice = BigNumber.from(1);
        const buyoutPrice = BigNumber.from(1);
        // Increase signer allowance
        await environment.hellContract.approve(environment.auctionHouseContract.address, auctionedAmount);
        // Verify the AuctionCreated event emission and his arguments
        await expect(environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            auctionedAmount,
            environment.fusdContract.address,
            bidPrice, // Bid Price
            buyoutPrice, // Buyout price
            auctionLength) // 2500 blocks from now
        ).to.emit(environment.auctionHouseContract, 'AuctionCreated').withArgs(
            environment.masterSigner.address,
            environment.hellContract.address,
            environment.fusdContract.address,
            currentTotalAuctions.add(1),
            auctionedAmount,
            bidPrice,
            buyoutPrice,
            auctionLength
        );
        const newTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        // Verify that all total auction variables increased their values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
        auctionId = newTotalAuctions;
    });

    it('HELL/FUSD: Perform a buyout paying 1 wei', async ()  => {
        const bidAmount = BigNumber.from(1);
        await environment.fusdContract.connect(environment.guest2Signer).approve(environment.auctionHouseContract.address, bidAmount);
        await expect(environment.auctionHouseContract.connect(environment.guest2Signer)
            .increaseBid(auctionId, bidAmount)).to.emit(environment.auctionHouseContract, "Buyout").withArgs(
            auctionId, environment.guest2Signer.address, bidAmount, bidAmount
        );
    });

    it('HELL/FUSD: Investor should be able to claim 1 wei worth of Hell', async ()  => {
        // NOTE: Since 1 wei is less than the treasury fees, it will be absolved from them
        const auction = (await environment.auctionHouseContract.getAuctions([auctionId]))[0];
        const userBalance: BigNumber = await environment.hellContract.balanceOf(environment.guest2Signer.address);
        const expectedFeeInHell: BigNumber = auction.auctionedAmount.div(auction.auctionHouseFee);
        const expectedAmountInHell: BigNumber = auction.auctionedAmount?.sub(expectedFeeInHell);

        await expect(environment.auctionHouseContract.connect(environment.guest2Signer).claimFunds(auction.id))
            .to.emit(environment.auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(auction.id, environment.guest2Signer.address,
                auction.auctionedTokenAddress, expectedAmountInHell, expectedFeeInHell);

        const afterUserBalance = await environment.hellContract.balanceOf(environment.guest2Signer.address);

        expect(userBalance.add(1)).to.be.equal(afterUserBalance);
    });

    it('HELL/FUSD: Auction Creator should be able to claim 1 wei worth of FUSD', async ()  => {
        // NOTE: Since 1 wei is less than the treasury fees, it will be absolved from them

        const auction: Auction = (await environment.auctionHouseContract.getAuctions([auctionId]))[0];
        const userBalance: BigNumber = await environment.fusdContract.balanceOf(auction.createdBy);

        // @ts-ignore
        const expectedFeeInFusd = auction.highestBid.div(auction.auctionHouseFee);
        const expectedAmountInFusd = auction.highestBid?.sub(expectedFeeInFusd);

        await expect(environment.auctionHouseContract.claimFunds(auction.id))
            .to.emit(environment.auctionHouseContract, 'ClaimSoldAuctionRewards')
            .withArgs(auction.id, auction.createdBy,
                environment.fusdContract.address, expectedAmountInFusd, expectedFeeInFusd);

        const afterUserBalance = await environment.fusdContract.balanceOf(auction.createdBy);
        expect(userBalance.add(1)).to.be.equal(afterUserBalance);
    });

}