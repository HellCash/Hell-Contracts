import {BigNumber, Contract, Signer} from "ethers";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {ethers} from "hardhat";
import contractAddresses from "../../scripts/contractAddresses.json";
import {EtherUtils} from "../../utils/ether-utils";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";

describe('[Auction House] function increaseBid',() => {
    let masterSigner: any;
    let guest1: any;
    let guest2: any;
    let hellAuctionIdPayWithEther: BigNumber = BigNumber.from(0);
    let etherAuctionIdPayWithHell: BigNumber = BigNumber.from(0);
    let doublonAuctionIdPayWithFUSD: BigNumber = BigNumber.from(0);
    before(async () => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1 = accountSigners[1];
        guest2 = accountSigners[2];

        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);

        // First we increase the allowances of the master signer
        await hellContract.approve(contractAddresses.auctionHouse, parseEther("666"));
        await doublonContract.approve(contractAddresses.auctionHouse, parseEther("10000"));

        // Give guest1 and guest2 some Hell
        await hellContract.transfer(guest1.address, parseEther("20"));
        await hellContract.transfer(guest2.address, parseEther("7.5"));

        // Give guest1 and guest2 some Fusd

        await fusdContract.transfer(guest1.address, parseUnits('5000', 6))
        await fusdContract.transfer(guest2.address, parseUnits('5000', 6))

        const auctionLength = await ethers.provider.getBlockNumber() + 2500;
        const currentTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();


        // We create a couple of Auctions to begin our tests
        await auctionHouseContract.createAuction(
            contractAddresses.hell, // Auction Hell
            parseEther("10"), // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            parseEther("5"), // Starting Bid Price
            parseEther("25"), // Buyout price
            auctionLength);

        hellAuctionIdPayWithEther = currentTotalAuctions.add(1);

        await auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther("25"), // Auction 25 worth of Ether
            contractAddresses.hell, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            auctionLength, {
                value: parseEther("25")
            }
        );
        etherAuctionIdPayWithHell = currentTotalAuctions.add(2);

        await auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Hell
            parseEther("15"), // Auction 30 worth of Doublon
            contractAddresses.fusd, // Against Fusd
            parseUnits("50",6), // Starting Bid Price
            parseUnits("100",6), // Buyout price
            auctionLength);

        doublonAuctionIdPayWithFUSD = currentTotalAuctions.add(3);
    });

    it('Shouldn\'t be able to place bids on a non existent Auction ID ', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        // Get total created auctions
        const totalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        await expect(auctionHouseContract.increaseBid(totalAuctions.add(20), parseEther("12"), {
            value: parseEther("12"),
        })).to.be.revertedWith("IB1");
        // Attempt with zero ID
        await expect(auctionHouseContract.increaseBid(0, parseEther("12"), {
            value: parseEther("12"),
        })).to.be.revertedWith("IB1");
    });

    it('Shouldn\'t be able to place Bids with a zero amount', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, parseEther("0"), {
            value: parseEther("0"),
        })).to.be.revertedWith("IB3");
    });

    it('Auction Creator shouldn\'t be able to place bids or make a buyout', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, parseEther("12")))
            .to.be.revertedWith('IB4');
    });

    it('Shouldn\'t be able to bid less than the starting price', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const bidAmount = parseEther("0.05");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.be.revertedWith('IB6');
    });

    it('Paid with ETHER: Should perform a successful bid', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const bidAmount = parseEther("12");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            hellAuctionIdPayWithEther, guest1.address, bidAmount, bidAmount
        );
    });

    it('Shouldn\'t be able to bid less than the highest bid', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const bidAmount = parseEther("10");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.be.revertedWith('IB5');
    });

    it('Paid with ETHER: Should fail if the user didn\'t send enough funds', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const bidAmount = parseEther("15");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: parseEther("2"),  // Here we are sending 2 ETHER instead of 15 as specified above.
        })).to.be.revertedWith('DA1');
    });

    it('Paid with ETHER: Should increase the user bid', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const currentUserBid: BigNumber = await auctionHouseContract._auctionBids(hellAuctionIdPayWithEther, guest1.address);
        const bidAmount = parseEther("2"); // We will increase the user bid by 2
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            hellAuctionIdPayWithEther, guest1.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('Paid with ETHER: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const currentUserBid: BigNumber = await auctionHouseContract._auctionBids(hellAuctionIdPayWithEther, guest1.address);
        // The buyout price was 35 ETH, since the user already bid 14, We require 21 more.
        const bidAmount = parseEther("21");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.emit(auctionHouseContract, "Buyout").withArgs(
            hellAuctionIdPayWithEther, guest1.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('Paid with ERC20: Bid Should fail if the user hasn\'t enough allowance', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        // Set the user Allowance back to 0
        await hellContract.approve(contractAddresses.auctionHouse, parseEther("0"));
        // Expect Revert
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, parseEther("5")))
            .to.be.revertedWith("DA3");
    });

    it('Paid with ERC20: Should fail if the user didn\'t send enough tokens', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        // Set the user Allowance back to 0
        await hellContract.approve(contractAddresses.auctionHouse, parseEther("0"));
        // Expect Revert
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, parseEther("5")))
            .to.be.revertedWith("DA3");
    });

    it('Paid with ERC20: Should perform a successful bid', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest2);
        await hellContract.approve(contractAddresses.auctionHouse, parseEther("50"));

        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const bidAmount = parseEther("5");
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, bidAmount)).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            etherAuctionIdPayWithHell, guest2.address, bidAmount, bidAmount
        );
    });

    it('Paid with ERC20: Should increase user bid', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const currentUserBid: BigNumber = await auctionHouseContract._auctionBids(etherAuctionIdPayWithHell, guest2.address);
        const bidAmount = parseEther("2.5"); // We will increase the user bid by 2.5 for a total of 7.5
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, bidAmount)).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            etherAuctionIdPayWithHell, guest2.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('Paid with ERC20: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const bidAmount = parseEther("10");
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1);
        await hellContract.approve(contractAddresses.auctionHouse, bidAmount);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        await expect(auctionHouseContract.increaseBid(etherAuctionIdPayWithHell, bidAmount)).to.emit(auctionHouseContract, "Buyout").withArgs(
            etherAuctionIdPayWithHell, guest1.address, bidAmount, bidAmount
        );
    });

    it('Paid with FUSD: Bid Should fail if the user hasn\'t enough allowance', async () => {
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        // Set the user Allowance back to 0
        await fusdContract.approve(contractAddresses.auctionHouse, parseEther("0"));
        // Expect Revert
        await expect(auctionHouseContract.increaseBid(doublonAuctionIdPayWithFUSD, parseUnits("50",6)))
            .to.be.revertedWith("DA3");
    });

    it('Paid with FUSD: Should fail if the user didn\'t send enough tokens', async () => {
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        // Set the user Allowance back to 0
        await fusdContract.approve(contractAddresses.auctionHouse, parseEther("0"));
        // Expect Revert
        await expect(auctionHouseContract.increaseBid(doublonAuctionIdPayWithFUSD, parseUnits("50",6)))
            .to.be.revertedWith("DA3");
    });

    it('Paid with FUSD: Should perform a successful bid', async () => {
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1);
        await fusdContract.approve(contractAddresses.auctionHouse, parseUnits("80",6));

        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const bidAmount = parseUnits("50",6);
        await expect(auctionHouseContract.increaseBid(doublonAuctionIdPayWithFUSD, bidAmount)).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            doublonAuctionIdPayWithFUSD, guest1.address, bidAmount, bidAmount
        );
    });

    it('Paid with FUSD: Should increase user bid', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        const currentUserBid: BigNumber = await auctionHouseContract._auctionBids(doublonAuctionIdPayWithFUSD, guest1.address);
        const bidAmount = parseUnits("30",6); // We will increase the user bid by 30 for a total of 80
        await expect(auctionHouseContract.increaseBid(doublonAuctionIdPayWithFUSD, bidAmount)).to.emit(auctionHouseContract, "BidIncreased").withArgs(
            doublonAuctionIdPayWithFUSD, guest1.address, bidAmount, currentUserBid.add(bidAmount)
        );
    });

    it('Paid with FUSD: Should perform a Buyout if the user sent the buyout price and Emit a Buyout event', async () => {
        const bidAmount = parseUnits("100",6);
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest2);
        await fusdContract.approve(contractAddresses.auctionHouse, bidAmount);
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        await expect(auctionHouseContract.increaseBid(doublonAuctionIdPayWithFUSD, bidAmount)).to.emit(auctionHouseContract, "Buyout").withArgs(
            doublonAuctionIdPayWithFUSD, guest2.address, bidAmount, bidAmount
        );
    });

    it('Shouldn\'t be able to place bids after the Auction has finished', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const bidAmount = parseEther("35.5");
        await expect(auctionHouseContract.increaseBid(hellAuctionIdPayWithEther, bidAmount, {
            value: bidAmount,
        })).to.be.revertedWith('IB2');
    });

});