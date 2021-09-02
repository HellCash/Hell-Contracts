import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {EtherUtils} from "../../utils/ether-utils";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";

export function createAuction() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Creating an Auction with a higher starting bid price than buyout price should fail', async () => {
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            parseEther("15"), // Buyout price  <------ REVERT
            await ethers.provider.getBlockNumber() + environment.minimumAuctionLength + 5) // Auction length
        ).to.be.revertedWith('CA1');
    });

    it(`Creating an Auction with a length lower than the minimum should fail`, async () => {
        // Attempt with Zero length
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            0) // <------ REVERT
        ).to.be.revertedWith('CA2');

        // Attempt with half the length
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength / 2))) // <---- REVERT
            .to.be.revertedWith('CA2');

        // Attempt with minimum length - 1
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + environment.minimumAuctionLength - 1) // <----- REVERT
        ).to.be.revertedWith('CA2');
    });

    it('Creating an Auction with a length higher than the maximum should fail', async() => {
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + environment.maximumAuctionLength + 2555) // <------ REVERT
        ).to.be.revertedWith('CA5');

        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.hellContract.address, // Against Hell
            parseEther("50"), // Starting Bid Price
            BigNumber.from(0), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.maximumAuctionLength * 2))) // <---- REVERT
            .to.be.revertedWith('CA5');
    });

    it('Creating an Auction against the same asset should fail', async () => {
        await expect(environment.auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether   <-------- REVERT
            parseEther("10"), // Auction 10 worth of Ether
            EtherUtils.zeroAddress(), // Against Ether <-------- REVERT
            parseEther("25"), // Starting Bid Price
            parseEther("50"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)),
            )
            .to.be.revertedWith('CA3');

        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon   <-------- REVERT
            parseEther("1000"), // Auction 1000 worth of Doublon
            environment.doublonContract.address, // Against Doublon <-------- REVERT
            parseEther("500"), // Starting Bid Price
            parseEther("1500"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)),
            )
            .to.be.revertedWith('CA3');
    });

    it('Creating an Auction without sending enough funds should fail', async () => {
        // Attempt with ETHER
        await expect(environment.auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther("20"), // Auction 20 worth of Ether
            environment.hellContract.address, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2), {
                value: parseEther("19") // <---------- REVERT, Signer sent less than 20
            })).to.be.revertedWith('DA1');
        // Attempt with ERC20
        // Increase signer allowances
        await environment.bDoublonContract.approve(environment.auctionHouseContract.address, parseEther("50000"));
        await expect(environment.auctionHouseContract.createAuction(
            environment.bDoublonContract.address, // Auction BDoublon
            parseEther("5000"), // REVERT: We will send 5000 tokens, but since they burn this transaction should revert.
            environment.hellContract.address, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + 3500))
            .to.be.revertedWith('DA4');
    });

    it('Creating an Auction without enough allowance should fail', async () => {
        await environment.doublonContract.approve(environment.auctionHouseContract.address, parseEther("10000"));
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("20000"), // <----- REVERT: Since we only have an allowance of 10k it should fail.
            environment.hellContract.address, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)))
            .to.be.revertedWith('DA3');
    });

    it('Creating an Auction without enough balance should fail', async () => {
        const guest = environment.accountSigners[3];
        // Sign Auction House Contract
        const auctionHouseContract: Contract = environment.auctionHouseContract.connect(guest);
        // Sign Doublon Contract
        const doublonContract: Contract = environment.doublonContract.connect(guest);
        // Increase guest Allowance
        await doublonContract.approve(environment.auctionHouseContract.address, parseEther("2500"));
        await expect(auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("2000"), //  <----- REVERT : This user has no Doublons
            environment.hellContract.address, // Against Hell
            parseEther("5"), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)))
            .to.be.revertedWith('DA2');  // DA2: Not enough Balance
    });

    it('Creating an Auction with a starting price lower than 1 wei should fail', async () => {
        await environment.doublonContract.approve(environment.auctionHouseContract.address, parseEther("1"));
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther("2000"),
            environment.hellContract.address, // Against Hell
            BigNumber.from(0), // Starting Bid Price  <----- REVERT : Must be higher than 0
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)))
            .to.be.revertedWith('CA4');  // CA4: The Auctioned amount and the Starting price must be higher than 0
    });

    it('Creating an Auction with an Auctioned Amount lower than 1 wei should fail', async () => {
        await environment.doublonContract.approve(environment.auctionHouseContract.address, parseEther("1"));
        await expect(environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            BigNumber.from(0),  // <----- REVERT : Must be higher than 0
            environment.hellContract.address, // Against Hell
            parseUnits("1", 6), // Starting Bid Price
            parseEther("10"), // Buyout price
            await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2)))
            .to.be.revertedWith('CA4');  // CA4: The Auctioned amount and the Starting price must be higher than 0
    });

    it('Should create ETHER/HELL Auction Successfully',async () => {
        // Request the current total auctions
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        // Define variables
        const auctionLength = await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2);
        const auctionedAmount = parseEther("16");
        const bidPrice = parseEther("5");
        const buyoutPrice = parseEther("15");
        // Verify the AuctionCreated event emission and his arguments
        await expect(environment.auctionHouseContract.connect(environment.accountSigners[5]).createAuction(
                EtherUtils.zeroAddress(), // Auction Ether
                auctionedAmount,
                environment.hellContract.address, // Against Hell
                bidPrice,
                buyoutPrice,
                auctionLength, {
                    value: auctionedAmount
                })).to.emit(environment.auctionHouseContract, 'AuctionCreated').withArgs(
                environment.accountSigners[5].address,
                EtherUtils.zeroAddress(),
                environment.hellContract.address,
                currentTotalAuctions.add(1),
                auctionedAmount,
                bidPrice,
                buyoutPrice,
                auctionLength);
        const newTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        // Verify that the total auctions variables increased his values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
    });

    it('Should create HELL/ETHER Auction Successfully',async () => {
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        const auctionLength = await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2);
        // Define variables
        const auctionedAmount = parseEther("10");
        const bidPrice = parseEther("5");
        const buyoutPrice = parseEther("25");
        // Increase signer allowance
        await environment.hellContract.approve(environment.auctionHouseContract.address, auctionedAmount);
        // Verify the AuctionCreated event emission and his arguments
        await expect(environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            auctionedAmount,
            EtherUtils.zeroAddress(), // Against Ether
            bidPrice, // Bid Price
            buyoutPrice, // Buyout price
            auctionLength)
         ).to.emit(environment.auctionHouseContract, 'AuctionCreated').withArgs(
            environment.masterSigner.address,
            environment.hellContract.address,
            EtherUtils.zeroAddress(),
            currentTotalAuctions.add(1),
            auctionedAmount,
            bidPrice,
            buyoutPrice,
            auctionLength
        );
        const newTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        // Verify that all total auction variables increased their values by one
        expect(currentTotalAuctions.add(1)).to.be.equal(newTotalAuctions);
    });

    it('Should create HELL/FUSD Auction Successfully',async () => {
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
        const auctionLength = await ethers.provider.getBlockNumber() + (environment.minimumAuctionLength * 2);
        // Define variables
        const auctionedAmount = parseEther("10");
        const bidPrice = parseUnits("500",6);
        const buyoutPrice = parseUnits("2500",6);
        // Increase signer allowance
        await environment.hellContract.approve(environment.auctionHouseContract.address, auctionedAmount);
        // Verify the AuctionCreated event emission and his arguments
        await expect(environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            auctionedAmount, // Auction 10 worth of Hell
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
    });
}