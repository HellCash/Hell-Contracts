import {expect} from "chai";
import contractAddresses from "../../scripts/contractAddresses.json";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {EtherUtils} from "../../utils/ether-utils";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {Auction} from "../../models/auction";
import {GetAuctionsMode} from "../../models/get-auctions-mode.enum";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";

describe("[Auction House] function createAuction", () => {
    let masterSigner: any;
    let guestSigner: any;
    let guest2Signer: any;
    let treasurySigner: any;
    let auctionHouseContract: Contract;

    before(async () => {
        const accountSigners = await ethers.getSigners();
        auctionHouseContract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        masterSigner = accountSigners[0];
        guestSigner = accountSigners[1];
        guest2Signer = accountSigners[2];
        treasurySigner = accountSigners[3];
    });

    it('Creating an Auction with a higher starting bid price than buyout price should fail', async () => {
        await expect(auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            contractAddresses.hell, // Against Hell
            parseEther("50"), // Starting Bid Price
            parseEther("15"), // Buyout price
            await ethers.provider.getBlockNumber() + 4100)).to.be.revertedWith('CA1');
    });

    it('Creating an Auction with a length lower than 2000 blocks should fail', async () => {
        // Attempt with Zero length
        await expect(auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            contractAddresses.hell, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + 0)).to.be.revertedWith('CA2');

        // Attempt with 1999 length
        await expect(auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            contractAddresses.hell, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + 99) // 1999 blocks from now.
        ).to.be.revertedWith('CA3');
    });

    it('Creating an Auction against the same asset should fail', async () => {
        await expect(auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            contractAddresses.doublon, // Against Doublon
            parseEther("500"), // Starting Bid Price
            parseEther("1500"), // Buyout price
            await ethers.provider.getBlockNumber() + 4100),
            'The auctioned token address and the selling token address cannot be the same')
            .to.be.revertedWith('CA3');
    });

    it('Creating an Auction without sending enough funds should fail', async () => {
        await expect(auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther("20"), // Auction 20 worth of Ether
            contractAddresses.hell, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + 3500, {
                value: parseEther("19")
            })).to.be.revertedWith('DA1');
    });

    it('Creating an Auction without enough allowance should fail', async () => {
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
        await doublonContract.approve(auctionHouseContract.address, parseEther("10000"));
        await expect(auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("20000"), // Since we only have an allowance of 10k it should fail.
            contractAddresses.hell, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + 3500))
            .to.be.revertedWith('DA3');
    });

    it('Creating an Auction without enough balance should fail', async () => {
        const contract: Contract = await AuctionTestHelpers.getAuctionContract(guest2Signer);
        const dc: Contract = await ContractTestHelpers.getDoublonContract(guest2Signer);
        await dc.approve(contractAddresses.auctionHouse, parseEther("2500")); // Increase guest2 Allowance

        const initialOwnerBalance = await dc.balanceOf(guest2Signer.address);
        await expect(contract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther("2000"), // This user has no Doublons
            contractAddresses.hell, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + 3500))
            .to.be.revertedWith('DA2');  // Throw DA2: Not enough Balance

        const finalOwnerBalance = await dc.balanceOf(guest2Signer.address);
        expect(finalOwnerBalance).to.equal(initialOwnerBalance);
    });

    it(' Should fail if the user didn\'t send enough tokens', async () => {
        const contract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        const bDoublonContract: Contract = await ContractTestHelpers.getBDoublonContract(masterSigner);
        await bDoublonContract.approve(contractAddresses.auctionHouse, parseEther("50000"));
        await expect(contract.createAuction(
            contractAddresses.bDoublon, // Auction BDoublon
            parseEther("5000"), // We will send 5000 tokens, but since they burn this transaction should revert.
            contractAddresses.hell, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + 3500))
            .to.be.revertedWith('DA4');
    });

    it('Paid with ERC20: Should create an Auction of Ether Successfully',async () => {
        const currentTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        const auctionLength = await ethers.provider.getBlockNumber() + 4100;

        const auctionedAmount = parseEther("16");
        const bidPrice = parseEther("5");
        const buyoutPrice = parseEther("15");

        // Verify the AuctionCreated event emission and his arguments
        await expect(auctionHouseContract.createAuction(
                EtherUtils.zeroAddress(), // Auction Ether
                auctionedAmount, // 35 worth of Ether
                contractAddresses.hell, // Against Hell
                bidPrice,
                buyoutPrice,
                auctionLength, { value: auctionedAmount}))
            .to.emit(auctionHouseContract, 'AuctionCreated')
            .withArgs(
                masterSigner.address,
                EtherUtils.zeroAddress(),
                contractAddresses.hell,
                currentTotalAuctions.add(1),
                auctionedAmount,
                bidPrice,
                buyoutPrice,
                auctionLength);

        const newTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        // Verify that all total auction variables increased their values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
    });

    it('Paid with ETHER: Should create an Auction of ERC20 token Successfully',async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(auctionHouseContract.address, parseEther("20"));
        const currentTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        const auctionLength = await ethers.provider.getBlockNumber() + 2500;

        const auctionedAmount = parseEther("10");
        const bidPrice = parseEther("5");
        const buyoutPrice = parseEther("25");

        // Verify the AuctionCreated event emission and his arguments
        await expect(auctionHouseContract.createAuction(
            contractAddresses.hell, // Auction Hell
            auctionedAmount, // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            bidPrice, // Bid Price
            buyoutPrice, // Buyout price
            auctionLength) // 2500 blocks from now
         ).to.emit(auctionHouseContract, 'AuctionCreated').withArgs(
            masterSigner.address,
            contractAddresses.hell,
            EtherUtils.zeroAddress(),
            currentTotalAuctions.add(1),
            auctionedAmount,
            bidPrice,
            buyoutPrice,
            auctionLength
        );

        const newTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        // Verify that all total auction variables increased their values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
    });

    it('Paid with FUSD: Should create an Auction of FUSD token Successfully',async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(auctionHouseContract.address, parseEther("20"));
        const currentTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        const auctionLength = await ethers.provider.getBlockNumber() + 2500;

        const auctionedAmount = parseEther("10");
        const bidPrice = parseUnits("500",6);
        const buyoutPrice = parseUnits("2500",6);

        // Verify the AuctionCreated event emission and his arguments
        await expect(auctionHouseContract.createAuction(
            contractAddresses.hell, // Auction Hell
            auctionedAmount, // Auction 10 worth of Hell
            contractAddresses.fusd, // Against Ether
            bidPrice, // Bid Price
            buyoutPrice, // Buyout price
            auctionLength) // 2500 blocks from now
        ).to.emit(auctionHouseContract, 'AuctionCreated').withArgs(
            masterSigner.address,
            contractAddresses.hell,
            contractAddresses.fusd,
            currentTotalAuctions.add(1),
            auctionedAmount,
            bidPrice,
            buyoutPrice,
            auctionLength
        );

        const newTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();
        // Verify that all total auction variables increased their values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
    });
});