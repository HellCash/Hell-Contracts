import {BigNumber, Contract} from "ethers";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {EtherUtils} from "../../utils/etherUtils";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";

export function increaseBid() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    let hellAuctionIdPayWithEther: BigNumber = BigNumber.from(0);
    let etherAuctionIdPayWithHell: BigNumber = BigNumber.from(0);
    let doublonAuctionIdPayWithFUSD: BigNumber = BigNumber.from(0);

    before(async () => {
        await environment.initialize();
        // Increase Master Signer allowances
        await environment.hellContract.approve(environment.auctionHouseContract.address, parseEther("666"));
        await environment.doublonContract.approve(environment.auctionHouseContract.address, parseEther("10000"));
        // Give guest1 and guest2 some Hell
        await environment.hellContract.transfer(environment.guest1Signer.address, parseEther("25"));
        await environment.hellContract.transfer(environment.guest2Signer.address, parseEther("20"));
        // Give guest1 and guest2 some Fusd
        await environment.fusdContract.transfer(environment.guest1Signer.address, parseUnits('5000', 6));
        await environment.fusdContract.transfer(environment.guest2Signer.address, parseUnits('5000', 6));

        const auctionLength = await ethers.provider.getBlockNumber() + 2500;
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();

        // We create a couple of Auctions to begin our tests
        await environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            parseEther("10"), // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            parseEther("5"), // Starting Bid Price
            parseEther("25"), // Buyout price
            auctionLength);

        hellAuctionIdPayWithEther = currentTotalAuctions.add(1);

        await environment.auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther("25"), // Auction 25 worth of Ether
            environment.hellContract.address, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            auctionLength, {
                value: parseEther("25")
            }
        );
        etherAuctionIdPayWithHell = currentTotalAuctions.add(2);

        await environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Hell
            parseEther("15"), // Auction 30 worth of Doublon
            environment.fusdContract.address, // Against Fusd
            parseUnits("50", 6), // Starting Bid Price
            parseUnits("100", 6), // Buyout price
            auctionLength);

        doublonAuctionIdPayWithFUSD = currentTotalAuctions.add(3);
    });

    it("Shouldn't be able to place bids on a non existent Auction ID", async () => {
        // Get total created auctions
        const totalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        // Attempt with an Id outside of range
        await expect(environment.auctionHouseContract.increaseBid(
            totalAuctions.add(20), // <---- REVERT
            parseEther("12"), {
                value: parseEther("12"),
            })).to.be.revertedWith("IB1");
        // Attempt with zero ID
        await expect(environment.auctionHouseContract.increaseBid(
            0,  // <---- REVERT
            parseEther("12"), {
                value: parseEther("12"),
            })).to.be.revertedWith("IB1");
    });

    it("Shouldn't be able to place Bids with a zero amount", async () => {
        await expect(environment.auctionHouseContract.connect(environment.guest1Signer)
            .increaseBid(
                etherAuctionIdPayWithHell,
                parseEther("0"), // <------ REVERT
                {value: parseEther("0")}
            )).to.be.revertedWith("IB3");
    });

    it("Auction Creator shouldn't be able to place bids or make a buyout", async () => {
        await expect(environment.auctionHouseContract.increaseBid(
            etherAuctionIdPayWithHell, // <----- REVERT
            parseEther("12")))
            .to.be.revertedWith('IB4');
    });

    it("Shouldn't be able to bid less than the starting price", async () => {
        const bidAmount = parseEther("0.05");
        await expect(environment.auctionHouseContract.connect(environment.guest1Signer)
            .increaseBid(
                hellAuctionIdPayWithEther,
                bidAmount, // <----- REVERT
                {value: bidAmount}
            )).to.be.revertedWith('IB6');
    });

    it('HELL/ETHER: Should perform a successful bid', async () => {
        const auctionHouseContract = environment.auctionHouseContract.connect(environment.guest1Signer);
        const bidAmount = parseEther("12");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            hellAuctionIdPayWithEther, environment.guest1Signer.address, bidAmount, bidAmount
        );
    });

    it("Shouldn't be able to bid less than the highest bid", async () => {
        const bidAmount = parseEther("10");
        await expect(environment.auctionHouseContract.connect(environment.guest2Signer)
            .increaseBid(
                hellAuctionIdPayWithEther,
                bidAmount, // <----- REVERT: Guest 1 already placed a bid for 12
                {value: bidAmount}
            )).to.be.revertedWith('IB5');
    });

    it("HELL/ETHER: Should fail if the user didn't send enough funds", async () => {
        const bidAmount = parseEther("15");
        await expect(environment.auctionHouseContract.connect(environment.guest2Signer)
            .increaseBid(hellAuctionIdPayWithEther, bidAmount, {
                value: parseEther("2"),  // REVERT: Here we are sending 2 ETHER instead of 15.
            })).to.be.revertedWith('DA1');
    });

    it('HELL/ETHER: Should increase the user bid', async () => {
        const auctionHouseContract: Contract = environment.auctionHouseContract.connect(environment.guest1Signer);
        const currentUserBid: BigNumber = await environment.auctionHouseContract._auctionBids(hellAuctionIdPayWithEther, environment.guest1Signer.address);
        const bidAmount = parseEther("2"); // We will increase the user bid by 2
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            hellAuctionIdPayWithEther, environment.guest1Signer.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('HELL/ETHER: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const auctionHouseContract: Contract = environment.auctionHouseContract.connect(environment.guest1Signer);
        const currentUserBid: BigNumber = await environment.auctionHouseContract._auctionBids(hellAuctionIdPayWithEther, environment.guest1Signer.address);
        // The buyout price was 35 ETH, since the user already bid 14, We require 21 more.
        const bidAmount = parseEther("21");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "Buyout").withArgs(
            hellAuctionIdPayWithEther, environment.guest1Signer.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('ETHER/HELL: Bid Should fail if the user hasn\'t enough allowance', async () => {
        const hellContract: Contract = environment.hellContract.connect(environment.guest1Signer);
        // Set the user Allowance back to 0
        await hellContract.approve(environment.auctionHouseContract.address, parseEther("0"));
        await expect(environment.auctionHouseContract.connect(environment.guest1Signer).increaseBid(
            etherAuctionIdPayWithHell,
            parseEther("5")))  /// <---- REVERT
            .to.be.revertedWith("DA3");
    });

    it('ETHER/HELL: Should perform a successful bid', async () => {
        const bidAmount = parseEther("5");
        // Increase guest2 allowance
        await environment.hellContract.connect(environment.guest2Signer)
            .approve(environment.auctionHouseContract.address, bidAmount);

        await expect(environment.auctionHouseContract.connect(environment.guest2Signer).increaseBid(etherAuctionIdPayWithHell, bidAmount))
            .to.emit(environment.auctionHouseContract, "BidIncreased").withArgs(
                etherAuctionIdPayWithHell, environment.guest2Signer.address, bidAmount, bidAmount
            );
    });

    it('ETHER/HELL: Should increase the user bid', async () => {
        const currentUserBid: BigNumber = await environment.auctionHouseContract._auctionBids(etherAuctionIdPayWithHell, environment.guest2Signer.address);
        const bidAmount = parseEther("2.5"); // We will increase the user bid by 2.5 for a total of 7.5
        // Increase guest2 allowance
        await environment.hellContract.connect(environment.guest2Signer)
            .approve(environment.auctionHouseContract.address, bidAmount);

        await expect(environment.auctionHouseContract.connect(environment.guest2Signer)
            .increaseBid(etherAuctionIdPayWithHell, bidAmount)).to.emit(environment.auctionHouseContract, "BidIncreased").withArgs(
            etherAuctionIdPayWithHell, environment.guest2Signer.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('ETHER/HELL: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const bidAmount = parseEther("10");
        await environment.hellContract.connect(environment.guest1Signer)
            .approve(environment.auctionHouseContract.address, bidAmount);

        await expect(environment.auctionHouseContract.connect(environment.guest1Signer).increaseBid(etherAuctionIdPayWithHell, bidAmount)).to.emit(environment.auctionHouseContract, "Buyout").withArgs(
            etherAuctionIdPayWithHell, environment.guest1Signer.address, bidAmount, bidAmount
        );
    });

    it('DOUBLON/FUSD: Should perform a successful bid', async () => {
        const bidAmount = parseUnits("50", 6);

        await environment.fusdContract.connect(environment.guest1Signer)
            .approve(environment.auctionHouseContract.address, bidAmount);

        await expect(environment.auctionHouseContract.connect(environment.guest1Signer)
            .increaseBid(doublonAuctionIdPayWithFUSD, bidAmount))
            .to.emit(environment.auctionHouseContract, "BidIncreased").withArgs(
                doublonAuctionIdPayWithFUSD, environment.guest1Signer.address, bidAmount, bidAmount
            );
    });

    it('DOUBLON/FUSD: Should increase user bid', async () => {
        const currentUserBid: BigNumber = await environment.auctionHouseContract._auctionBids(doublonAuctionIdPayWithFUSD, environment.guest1Signer.address);
        const bidAmount = parseUnits("30", 6); // We will increase the user bid by 30 for a total of 80

        await environment.fusdContract.connect(environment.guest1Signer)
            .approve(environment.auctionHouseContract.address, bidAmount);

        await expect(environment.auctionHouseContract.connect(environment.guest1Signer)
            .increaseBid(doublonAuctionIdPayWithFUSD, bidAmount)).to.emit(environment.auctionHouseContract, "BidIncreased").withArgs(
            doublonAuctionIdPayWithFUSD, environment.guest1Signer.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('DOUBLON/FUSD: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const bidAmount = parseUnits("100", 6);
        await environment.fusdContract.connect(environment.guest2Signer).approve(environment.auctionHouseContract.address, bidAmount);
        await expect(environment.auctionHouseContract.connect(environment.guest2Signer)
            .increaseBid(doublonAuctionIdPayWithFUSD, bidAmount)).to.emit(environment.auctionHouseContract, "Buyout").withArgs(
            doublonAuctionIdPayWithFUSD, environment.guest2Signer.address, bidAmount, bidAmount
        );
    });

    it('Shouldn\'t be able to place bids after the Auction has finished', async () => {
        const bidAmount = parseEther("35.5");
        await expect(environment.auctionHouseContract.connect(environment.guest2Signer).increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.be.revertedWith('IB2');
    });

}