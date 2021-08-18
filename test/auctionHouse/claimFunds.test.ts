import {BigNumber, Contract} from 'ethers';
import {ethers} from 'hardhat';
import erc20sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import {parseEther, parseUnits} from 'ethers/lib/utils';
import {EtherUtils} from '../../utils/ether-utils';
import {expect} from 'chai';
import {Auction} from '../../models/auction';
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";

export function claimFunds() {
    let hellAuctionIdPayWithEther: BigNumber;
    let etherAuctionIdPayWithHell: BigNumber;
    let doublonAuctionIdPayWithFusd: BigNumber;
    let closedAuctionId: BigNumber;
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    
    before(async () => {
        await environment.initialize();
        // Increase the allowances of the master signer
        await environment.hellContract.approve(environment.auctionHouseContract.address, parseEther('100'));
        await environment.doublonContract.approve(environment.auctionHouseContract.address, parseEther('1000'));

        // Give guest1 and guest2 some Hell
        await environment.hellContract.transfer(environment.guest1Signer.address, parseEther('20'));
        await environment.hellContract.transfer(environment.guest2Signer.address, parseEther('50'));

        // Give guest1 and guest2 some Fusd
        await environment.fusdContract.transfer(environment.guest1Signer.address, parseUnits('50000',6));
        await environment.fusdContract.transfer(environment.guest2Signer.address, parseUnits('20000',6));

        const auctionLength = await ethers.provider.getBlockNumber() + 2000;
        const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();

        // Create a couple of Auctions to begin our tests
        await environment.auctionHouseContract.createAuction(
            environment.hellContract.address, // Auction Hell
            parseEther('10'), // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            parseEther('2'), // Starting Bid Price
            parseEther('25'), // Buyout price
            auctionLength);

        hellAuctionIdPayWithEther = currentTotalAuctions.add(1);

        await environment.auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther('25'), // Auction 25 worth of Ether
            environment.hellContract.address, // Against Hell
            parseEther('2'), // Starting Bid Price
            parseEther('20'), // Buyout price
            auctionLength, {
                value: parseEther('25')
            }
        );

        etherAuctionIdPayWithHell = currentTotalAuctions.add(2);

        await environment.auctionHouseContract.createAuction(
            environment.doublonContract.address, // Auction Doublon
            parseEther('1000'), // Auction 100 worth of Doublon
            environment.fusdContract.address, // Against Fusd
            parseUnits('500',6), // Starting Bid Price
            parseUnits('1500',6), // Buyout price
            auctionLength);

        doublonAuctionIdPayWithFusd = currentTotalAuctions.add(3);

        // Make Guest 1 The highest bidder
        const guest1SignedAuctionHouse = environment.auctionHouseContract.connect(environment.guest1Signer);
        // Guest 1 bids 5 Ether
        await placeBid(guest1SignedAuctionHouse, hellAuctionIdPayWithEther,parseEther('5'));
        // Guest 1 bids 5 Hell
        await placeBid(guest1SignedAuctionHouse, etherAuctionIdPayWithHell, parseEther('5'));
        // Guest 1 bids 600 Fusd
        await placeBid(guest1SignedAuctionHouse, doublonAuctionIdPayWithFusd, parseUnits('600',6));

        // Create one last auction which will be closed right away
        await environment.auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther('25'), // Auction 25 worth of Ether
            environment.hellContract.address, // Against Hell
            parseEther('5'), // Starting Bid Price
            parseEther('10'), // Buyout price
            auctionLength, {
                value: parseEther('25')
            }
        );
        closedAuctionId = currentTotalAuctions.add(4);
        await environment.auctionHouseContract._forceEndAuction(closedAuctionId);
    });

    it('Auction Creator shouldn\'t be able to claimFunds until Auction ends', async () => {
        await expect(environment.auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF2');
        await expect(environment.auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF2');
        await expect(environment.auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF2');
    });

    it('Highest Bidder shouldn\'t be able to claimFunds until Auction ends', async () => {
        const auctionHouseContract: Contract = environment.auctionHouseContract.connect(environment.guest1Signer);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF2');
    });

    it('Shouldn\'t be able to claim bids if you don\'t have any', async () => {
        const auctionHouseContract: Contract = environment.auctionHouseContract.connect(environment.guest2Signer);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF3');
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF3');
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF3');
    });

    it('Losing Bidders should be able to claim their lost bids', async () => {
        // Guest 2 proceeds to place higher bids than guest 1
        const guest2SignedAuctionHouseContract = environment.auctionHouseContract.connect(environment.guest2Signer);
        // Guest 2 bids 25 Ether buying out the Auction.
        await placeBid(guest2SignedAuctionHouseContract, hellAuctionIdPayWithEther, parseEther('25'));
        // Guest 2 bids 10 Hell buying out the Auction
        await placeBid(guest2SignedAuctionHouseContract, etherAuctionIdPayWithHell, parseEther('20'));
        // Guest 2 bids 100 Fusd buying out the Auction
        await placeBid(guest2SignedAuctionHouseContract, doublonAuctionIdPayWithFusd, parseUnits('1500',6));
        const guest1SignedAuctionHouseContract: Contract = environment.auctionHouseContract.connect(environment.guest1Signer);

        const etherAuction: Auction = (await guest1SignedAuctionHouseContract.getAuctions([etherAuctionIdPayWithHell]))[0];
        await expect(guest1SignedAuctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.emit(guest1SignedAuctionHouseContract, 'ClaimLostBids')
            .withArgs(etherAuctionIdPayWithHell,
                environment.guest1Signer.address,
                environment.hellContract.address,
                etherAuction.yourBid);

        const hellAuction: Auction = (await guest1SignedAuctionHouseContract.getAuctions([hellAuctionIdPayWithEther]))[0];
        await expect(guest1SignedAuctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.emit(guest1SignedAuctionHouseContract, 'ClaimLostBids')
            .withArgs(hellAuctionIdPayWithEther,
                environment.guest1Signer.address,
                EtherUtils.zeroAddress(),
                hellAuction.yourBid);

        const doublonAuction: Auction = (await guest1SignedAuctionHouseContract.getAuctions([doublonAuctionIdPayWithFusd]))[0];
        await expect(guest1SignedAuctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd))
            .to.emit(guest1SignedAuctionHouseContract, 'ClaimLostBids')
            .withArgs(doublonAuctionIdPayWithFusd,
                environment.guest1Signer.address,
                environment.fusdContract.address,
                doublonAuction.yourBid);
    });

    it('Losing Bidders should be able to claim their lost bids only once', async () => {
        const auctionHouseContract: Contract = await environment.auctionHouseContract.connect(environment.guest1Signer);
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.be.revertedWith("ACF3");
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.be.revertedWith("ACF3");
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd))
            .to.be.revertedWith("ACF3");
    });

    it('Auction Creator should be able to claim his rewards when Auction ends and when successfully sold', async () => {
    const auctions = await environment.auctionHouseContract.getAuctions([etherAuctionIdPayWithHell, hellAuctionIdPayWithEther,doublonAuctionIdPayWithFusd]);
    const etherAuction: Auction = auctions[0];
    const hellAuction: Auction = auctions[1];
    const doublonAuction: Auction = auctions[2];

    // @ts-ignore
    const expectedFeeInHell = etherAuction.highestBid.div(etherAuction.auctionHouseFee);
    const expectedAmountInHell = etherAuction.highestBid?.sub(expectedFeeInHell);

    await expect(environment.auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
        .to.emit(environment.auctionHouseContract, 'ClaimSoldAuctionRewards')
        .withArgs(etherAuctionIdPayWithHell, environment.masterSigner.address,
            environment.hellContract.address, expectedAmountInHell, expectedFeeInHell);

    // @ts-ignore
    const expectedFeeInEther = hellAuction.highestBid.div(hellAuction.auctionHouseFee);
    const expectedAmountInEther = hellAuction.highestBid?.sub(expectedFeeInEther);

    await expect(environment.auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
        .to.emit(environment.auctionHouseContract, 'ClaimSoldAuctionRewards')
        .withArgs(hellAuctionIdPayWithEther, environment.masterSigner.address,
            EtherUtils.zeroAddress(), expectedAmountInEther, expectedFeeInEther);

    // @ts-ignore
    const expectedFeeInFusd = doublonAuction.highestBid.div(doublonAuction.auctionHouseFee);
    const expectedAmountInFusd = doublonAuction.highestBid?.sub(expectedFeeInFusd);

    await expect(environment.auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd))
        .to.emit(environment.auctionHouseContract, 'ClaimSoldAuctionRewards')
        .withArgs(doublonAuctionIdPayWithFusd, environment.masterSigner.address,
            environment.fusdContract.address, expectedAmountInFusd, expectedFeeInFusd);
    });

    it('Auction Creator should be able to claim his funds back if the auction is never sold', async () => {
        const auction: Auction = (await environment.auctionHouseContract.getAuctions([closedAuctionId]))[0];
        // @ts-ignore
        const expectedFee = auction.auctionedAmount.div(auction.auctionHouseFee);
        const expectedAmount = auction.auctionedAmount?.sub(expectedFee);

        await expect(environment.auctionHouseContract.claimFunds(closedAuctionId))
            .to.emit(environment.auctionHouseContract, 'ClaimUnsoldAuctionFunds')
            .withArgs(auction.id, environment.masterSigner.address, auction.auctionedTokenAddress , expectedAmount, expectedFee);
    });
    //
    it('Auction Creator should only be able to claim his rewards or funds once', async () => {
        await expect(environment.auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.be.revertedWith("ACF1");
    });

    it('Auction Winner should be able to claim his rewards when the Auction ends', async () => {
        const auctionHouseContract: Contract = await environment.auctionHouseContract.connect(environment.guest2Signer);
        const auctions = await environment.auctionHouseContract.getAuctions([etherAuctionIdPayWithHell, hellAuctionIdPayWithEther, doublonAuctionIdPayWithFusd]);
        const etherAuction: Auction = auctions[0];
        const hellAuction: Auction = auctions[1];
        const doublonAuction: Auction = auctions[2];

        // @ts-ignore
        const expectedFeeInEther = etherAuction.auctionedAmount.div(etherAuction.auctionHouseFee);
        const expectedAmountInEther = etherAuction.auctionedAmount?.sub(expectedFeeInEther);

        await expect(auctionHouseContract.claimFunds(etherAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(etherAuction.id, environment.guest2Signer.address, etherAuction.auctionedTokenAddress, expectedAmountInEther, expectedFeeInEther);

        // @ts-ignore
        const expectedFeeInHell = hellAuction.auctionedAmount.div(hellAuction.auctionHouseFee);
        const expectedAmountInHell = hellAuction.auctionedAmount?.sub(expectedFeeInHell);

        await expect(auctionHouseContract.claimFunds(hellAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(hellAuction.id, environment.guest2Signer.address, hellAuction.auctionedTokenAddress, expectedAmountInHell, expectedFeeInHell);

        // @ts-ignore
        const expectedFeeInFusd = doublonAuction.auctionedAmount.div(doublonAuction.auctionHouseFee);
        const expectedAmountInFusd = doublonAuction.auctionedAmount?.sub(expectedFeeInFusd);

        await expect(auctionHouseContract.claimFunds(doublonAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(doublonAuction.id, environment.guest2Signer.address, doublonAuction.auctionedTokenAddress, expectedAmountInFusd, expectedFeeInFusd);
    });
    //
    it('Auction Winner should be able to claim his rewards only once', async () => {
        const auctionHouseContract: Contract = await environment.auctionHouseContract.connect(environment.guest2Signer);
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.be.revertedWith("ACF1");
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.be.revertedWith("ACF1");
    });
}

async function placeBid(auctionHouseContract: Contract, auctionId: BigNumber, bidAmount: any) {
    const auction: Auction = (await auctionHouseContract.getAuctions([auctionId]))[0];
    if (auction.payingTokenAddress == EtherUtils.zeroAddress()) {
        await auctionHouseContract.increaseBid(auctionId, bidAmount, {value: bidAmount});
    } else {
        // @ts-ignore
        const tokenInterface: Contract = await ethers.getContractAt(erc20sol.abi, auction.payingTokenAddress, auctionHouseContract.signer);
        await tokenInterface.approve(auctionHouseContract.address, bidAmount);
        await auctionHouseContract.increaseBid(auctionId, bidAmount);
    }
}
