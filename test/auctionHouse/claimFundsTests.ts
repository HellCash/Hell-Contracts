import {BigNumber, Contract} from 'ethers';
import {ethers} from 'hardhat';
import {AuctionTestHelpers} from '../../helpers/AuctionTestHelpers';
import {HellTestHelpers} from '../../helpers/HellTestHelpers';
import erc20sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import contractAddresses from '../../scripts/contractAddresses.json';
import {parseEther, parseUnits} from 'ethers/lib/utils';
import {EtherUtils} from '../../utils/ether-utils';
import {expect} from 'chai';
import {Auction} from '../../models/auction';
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";

describe('[Auction House] function claimFunds', async () => {
    let masterSigner: any;
    let guest1: any;
    let guest2: any;
    let hellAuctionIdPayWithEther: BigNumber = BigNumber.from(0);
    let etherAuctionIdPayWithHell: BigNumber = BigNumber.from(0);
    let doublonAuctionIdPayWithFusd: BigNumber = BigNumber.from(0);
    let closedAuctionId: BigNumber = BigNumber.from(0);
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
        await hellContract.approve(contractAddresses.auctionHouse, parseEther('100'));
        await doublonContract.approve(contractAddresses.auctionHouse, parseEther('1000'));

        // Give guest1 and guest2 some Hell
        await hellContract.transfer(guest1.address, parseEther('20'));
        await hellContract.transfer(guest2.address, parseEther('20'));

        // Give guest1 and guest2 some Fusd
        await fusdContract.transfer(guest1.address, parseUnits('50000',6));
        await fusdContract.transfer(guest2.address, parseUnits('20000',6));


        const auctionLength = await ethers.provider.getBlockNumber() + 2000;
        const currentTotalAuctions: BigNumber = await auctionHouseContract._totalAuctions();

        // We create a couple of Auctions to begin our tests
        await auctionHouseContract.createAuction(
            contractAddresses.hell, // Auction Hell
            parseEther('10'), // Auction 10 worth of Hell
            EtherUtils.zeroAddress(), // Against Ether
            parseEther('2'), // Starting Bid Price
            parseEther('25'), // Buyout price
            auctionLength);

        hellAuctionIdPayWithEther = currentTotalAuctions.add(1);

        await auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther('25'), // Auction 25 worth of Ether
            contractAddresses.hell, // Against Hell
            parseEther('2'), // Starting Bid Price
            parseEther('20'), // Buyout price
            auctionLength, {
                value: parseEther('25')
            }
        );

        etherAuctionIdPayWithHell = currentTotalAuctions.add(2);

        await auctionHouseContract.createAuction(
            contractAddresses.doublon, // Auction Doublon
            parseEther('1000'), // Auction 100 worth of Doublon
            contractAddresses.fusd, // Against Fusd
            parseUnits('500',6), // Starting Bid Price
            parseUnits('1500',6), // Buyout price
            auctionLength);

        doublonAuctionIdPayWithFusd = currentTotalAuctions.add(3);

        // Guest 1 bids 5 Ether
        await placeBid(guest1, hellAuctionIdPayWithEther,parseEther('5'));
        // Guest 1 bids 5 Hell
        await placeBid(guest1, etherAuctionIdPayWithHell, parseEther('5'));
        // Guest 1 bids 600 Fusd
        await placeBid(guest1, doublonAuctionIdPayWithFusd, parseUnits('600',6));

        // We create one last auction which will be closed right away
        await auctionHouseContract.createAuction(
            EtherUtils.zeroAddress(), // Auction Ether
            parseEther('25'), // Auction 25 worth of Ether
            contractAddresses.hell, // Against Hell
            parseEther('5'), // Starting Bid Price
            parseEther('10'), // Buyout price
            auctionLength, {
                value: parseEther('25')
            }
        );
        closedAuctionId = currentTotalAuctions.add(4);
        await auctionHouseContract._forceEndAuction(closedAuctionId);
    });

    it('Auction Creator shouldn\'t be able to claimFunds until Auction ends', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF2');
    });

    it('Highest Bidder shouldn\'t be able to claimFunds until Auction ends', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF2');
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF2');
    });

    it('Shouldn\'t be able to claim bids if you don\'t have any', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther)).to.be.revertedWith('ACF3');
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell)).to.be.revertedWith('ACF3');
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd)).to.be.revertedWith('ACF3');
    });

    it('Losing Bidders should be able to claim his lost bids', async () => {
        // Guest 2 bids 25 Ether buying out the Auction.
        await placeBid(guest2, hellAuctionIdPayWithEther, parseEther('25'));
        // Guest 2 bids 10 Hell buying out the Auction
        await placeBid(guest2, etherAuctionIdPayWithHell, parseEther('20'));
        // Guest 2 bids 100 Fusd buying out the Auction
        await placeBid(guest2, doublonAuctionIdPayWithFusd, parseUnits('1500',6));

        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest1);

        const etherAuction: Auction = (await auctionHouseContract.getAuctions([etherAuctionIdPayWithHell]))[0];
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.emit(auctionHouseContract, 'ClaimLostBids')
            .withArgs(etherAuctionIdPayWithHell, guest1.address, contractAddresses.hell, etherAuction.yourBid);

        const hellAuction: Auction = (await auctionHouseContract.getAuctions([hellAuctionIdPayWithEther]))[0];
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.emit(auctionHouseContract, 'ClaimLostBids')
            .withArgs(hellAuctionIdPayWithEther, guest1.address, EtherUtils.zeroAddress(), hellAuction.yourBid);

        const doublonAuction: Auction = (await auctionHouseContract.getAuctions([doublonAuctionIdPayWithFusd]))[0];
        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd))
            .to.emit(auctionHouseContract, 'ClaimLostBids')
            .withArgs(doublonAuctionIdPayWithFusd, guest1.address, contractAddresses.fusd, doublonAuction.yourBid);
    });

    it('Auction Creator should be able to claim his rewards when Auctions ended and were successfully sold', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        const auctions = await auctionHouseContract.getAuctions([etherAuctionIdPayWithHell, hellAuctionIdPayWithEther,doublonAuctionIdPayWithFusd]);
        const etherAuction: Auction = auctions[0];
        const hellAuction: Auction = auctions[1];
        const doublonAuction: Auction = auctions[2];

        // @ts-ignore
        const expectedFeeInHell = etherAuction.highestBid.div(etherAuction.auctionHouseFee);
        const expectedAmountInHell = etherAuction.highestBid?.sub(expectedFeeInHell);

        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.emit(auctionHouseContract, 'ClaimSoldAuctionRewards')
            .withArgs(etherAuctionIdPayWithHell, masterSigner.address, contractAddresses.hell, expectedAmountInHell, expectedFeeInHell);

        // @ts-ignore
        const expectedFeeInEther = hellAuction.highestBid.div(hellAuction.auctionHouseFee);
        const expectedAmountInEther = hellAuction.highestBid?.sub(expectedFeeInEther);

        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.emit(auctionHouseContract, 'ClaimSoldAuctionRewards')
            .withArgs(hellAuctionIdPayWithEther, masterSigner.address, EtherUtils.zeroAddress(), expectedAmountInEther, expectedFeeInEther);

        // @ts-ignore
        const expectedFeeInFusd = doublonAuction.highestBid.div(doublonAuction.auctionHouseFee);
        const expectedAmountInFusd = doublonAuction.highestBid?.sub(expectedFeeInFusd);

        await expect(auctionHouseContract.claimFunds(doublonAuctionIdPayWithFusd))
            .to.emit(auctionHouseContract, 'ClaimSoldAuctionRewards')
            .withArgs(doublonAuctionIdPayWithFusd, masterSigner.address, contractAddresses.fusd, expectedAmountInFusd, expectedFeeInFusd);

    });

    it('Auction Creator should be able to claim his funds back if the auction is never sold', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        const auction: Auction = (await auctionHouseContract.getAuctions([closedAuctionId]))[0];

        // @ts-ignore
        const expectedFee = auction.auctionedAmount.div(auction.auctionHouseFee);
        const expectedAmount = auction.auctionedAmount?.sub(expectedFee);

        await expect(auctionHouseContract.claimFunds(closedAuctionId))
            .to.emit(auctionHouseContract, 'ClaimUnsoldAuctionFunds')
            .withArgs(auction.id, masterSigner.address, auction.auctionedTokenAddress , expectedAmount, expectedFee);
    });
    //
    it('Auction Creator should only be able to claim his rewards or funds only once', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.be.revertedWith("ACF1");
    });

    it('Auction Winner should be able to claim his rewards when the Auction ends', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        const auctions = await auctionHouseContract.getAuctions([etherAuctionIdPayWithHell, hellAuctionIdPayWithEther, doublonAuctionIdPayWithFusd]);
        const etherAuction: Auction = auctions[0];
        const hellAuction: Auction = auctions[1];
        const doublonAuction: Auction = auctions[2];

        // @ts-ignore
        const expectedFeeInEther = etherAuction.auctionedAmount.div(etherAuction.auctionHouseFee);
        const expectedAmountInEther = etherAuction.auctionedAmount?.sub(expectedFeeInEther);

        await expect(auctionHouseContract.claimFunds(etherAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(etherAuction.id, guest2.address, etherAuction.auctionedTokenAddress, expectedAmountInEther, expectedFeeInEther);

        // @ts-ignore
        const expectedFeeInHell = hellAuction.auctionedAmount.div(hellAuction.auctionHouseFee);
        const expectedAmountInHell = hellAuction.auctionedAmount?.sub(expectedFeeInHell);

        await expect(auctionHouseContract.claimFunds(hellAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(hellAuction.id, guest2.address, hellAuction.auctionedTokenAddress, expectedAmountInHell, expectedFeeInHell);

        // @ts-ignore
        const expectedFeeInFusd = doublonAuction.auctionedAmount.div(doublonAuction.auctionHouseFee);
        const expectedAmountInFusd = doublonAuction.auctionedAmount?.sub(expectedFeeInFusd);

        await expect(auctionHouseContract.claimFunds(doublonAuction.id))
            .to.emit(auctionHouseContract, 'ClaimWonAuctionRewards')
            .withArgs(doublonAuction.id, guest2.address, doublonAuction.auctionedTokenAddress, expectedAmountInFusd, expectedFeeInFusd);
    });
    //
    it('Auction Winner should be able to claim his rewards only once', async () => {
        const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(guest2);
        await expect(auctionHouseContract.claimFunds(etherAuctionIdPayWithHell))
            .to.be.revertedWith("ACF1");
        await expect(auctionHouseContract.claimFunds(hellAuctionIdPayWithEther))
            .to.be.revertedWith("ACF1");
    });
});

async function placeBid(signer: any, auctionId: BigNumber, bidAmount: any) {
    const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(signer);
    const auction: Auction = (await auctionHouseContract.getAuctions([auctionId]))[0];
    if (auction.payingTokenAddress == EtherUtils.zeroAddress()) {
        await auctionHouseContract.increaseBid(auctionId, bidAmount, {value: bidAmount});
    } else {
        // @ts-ignore
        const tokenInterface: Contract = await ethers.getContractAt(erc20sol.abi, auction.payingTokenAddress, signer);
        await tokenInterface.approve(contractAddresses.auctionHouse, bidAmount);
        await auctionHouseContract.increaseBid(auctionId, bidAmount);
    }
}
