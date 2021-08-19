import {BigNumber, Contract} from "ethers";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {ethers} from "hardhat";
import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import erc20Sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import {TokenName} from "../../enums/tokenName";
import {formatUnits} from "ethers/lib/utils";
import {Auction} from "../../models/auction";

export function workflow(
    auctionedToken: TokenName,
    auctionedAmount: BigNumber,
    payingToken: TokenName,
    startingPrice: BigNumber,
    buyoutPrice: BigNumber,
    lengthInBlocks: number,
    maximumBidders: number | null = 99999,
    ) {
    return () => {
        let auctionedTokenAddress: string;
        let payingTokenAddress: string;
        let auctionId: BigNumber;
        let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
        let availableSigners: any[];
        before(async () => {
            expect(payingToken).to.not.be.equal(auctionedToken);
            await environment.initialize(lengthInBlocks / 2, 800, auctionedAmount);
            auctionedTokenAddress = getTokenAddress(environment, auctionedToken);
            payingTokenAddress = getTokenAddress(environment, payingToken);
            availableSigners = environment.accountSigners;
            // Remove the master signer and the treasury address from the list of available signers
            availableSigners.splice(0, 2);
            // Narrow down the available signers
            if (maximumBidders) {
                availableSigners = availableSigners.slice(0, maximumBidders + 1);
            }
        });

        it('should create the Auction', async () => {
            // Define variables
            const currentTotalAuctions: BigNumber = await environment.auctionHouseContract._totalAuctions();
            const auctionLength = await ethers.provider.getBlockNumber() + lengthInBlocks;

            let override = {};
            // If we are Auctioning Ether, override the msg value
            if (auctionedTokenAddress == EtherUtils.zeroAddress()) {
                override = {
                    value: auctionedAmount
                }
            // If we are Auctioning an ERC20, increase allowances
            } else {
                // Increase signer allowance
                const auctionedTokenContract: Contract = await ethers.getContractAt(erc20Sol.abi, auctionedTokenAddress, environment.masterSigner);
                await auctionedTokenContract.approve(environment.auctionHouseContract.address, auctionedAmount);
            }

            // Verify the AuctionCreated event emission and his arguments
            await expect(environment.auctionHouseContract.createAuction(
                auctionedTokenAddress,
                auctionedAmount,
                payingTokenAddress,
                startingPrice,
                buyoutPrice,
                auctionLength,
                override)
            ).to.emit(environment.auctionHouseContract, 'AuctionCreated').withArgs(
                environment.masterSigner.address,
                auctionedTokenAddress,
                payingTokenAddress,
                currentTotalAuctions.add(1),
                auctionedAmount,
                startingPrice,
                buyoutPrice,
                auctionLength
            );
            auctionId = await environment.auctionHouseContract._totalAuctions();
            const auction: Auction = (await environment.auctionHouseContract.getAuctions([auctionId]))[0];
            console.log(auctionId, auction);
            // Verify that all total auction variables increased their values by one
            expect(currentTotalAuctions.add(1)).to.be.equal(auctionId);
        });

        it('should perform bids with every signer or until the auction ends', async () => {
            let i = 0;
            while (true) {
                if (i == availableSigners.length) {
                    i = 0;
                }
                let bidAmount: BigNumber;
                const auction: Auction = (await environment.auctionHouseContract.connect(availableSigners[i]).getAuctions([auctionId]))[0];
                // @ts-ignore
                // If the auction ended, break the loop
                if (auction.endsAtBlock.toNumber() <= await ethers.provider.getBlockNumber()) {
                    console.log(`\t Auction ended in block ${auction.endsAtBlock.toString()}`);
                    break;
                }
                // @ts-ignore
                if (auction.highestBid.isZero()) {
                    // use starting price
                    // @ts-ignore
                    bidAmount = auction.startingPrice;
                } else {
                    // Add 5% more
                    if (auction.yourBid?.isZero()) {
                        // @ts-ignore
                        bidAmount = auction.highestBid.add(auction.highestBid.div(20));
                    } else {
                        // @ts-ignore
                        bidAmount = auction.highestBid.add(auction.highestBid.div(20)).sub(auction.yourBid);
                    }
                }

                let override = {};
                // If we are placing a bid with Ether, override the msg value
                if (payingTokenAddress == EtherUtils.zeroAddress()) {
                    override = {
                        value: bidAmount
                    }
                    // If we are bidding with a ERC20, increase allowances
                } else {
                    // We'll assume that the Master signer has enough funds to share with every guest
                    let payingTokenContract: Contract = await ethers.getContractAt(erc20Sol.abi,
                        auctionedTokenAddress, environment.masterSigner);
                    await payingTokenContract.transfer(availableSigners[i].address, bidAmount);
                    // Increase signer allowance
                    await payingTokenContract.connect(availableSigners[i])
                        .approve(environment.auctionHouseContract.address, auctionedAmount);
                }

                const currentUserBid: BigNumber = await environment.auctionHouseContract
                    ._auctionBids(auctionId, availableSigners[i].address);

                await expect(environment.auctionHouseContract.connect(availableSigners[i])
                    .increaseBid(auctionId, bidAmount, override)).to.not.be.reverted;

                const auctionAfter: Auction = (await environment.auctionHouseContract.connect(availableSigners[i]).getAuctions([auctionId]))[0];
                // Verify that the user bid was placed correctly
                expect(currentUserBid.add(bidAmount)).to.be.equal(auctionAfter.yourBid);
                console.log(`\t [Guest ${i}] (bids: ${formatUnits(bidAmount, getTokenDecimals(payingToken))} | ${bidAmount} wei) (total bid: ${formatUnits(auctionAfter.yourBid, getTokenDecimals(payingToken))} | ${auctionAfter.yourBid} wei)`);
                i += 1;
            }
        });

        it('should claim everyone lost bids', function () {

        });

        it('should claim winner rewards', function () {

        });

        it('should claim creator rewards', function () {

        });

    }
}

function getTokenAddress(environment: auctionHouseTestingEnvironment, name: TokenName): string {
    switch (name) {
        case TokenName.Ether:
            return EtherUtils.zeroAddress();
        case TokenName.FUSD:
            return environment.fusdContract.address;
        case TokenName.Doublon:
            return environment.doublonContract.address;
        case TokenName.Hell:
            return environment.hellContract.address;
        case TokenName.Random:
            return environment.randomContract.address;
    }

    throw "You didn't provide a valid token name";
}

function getTokenDecimals(name: TokenName): number {
    switch (name) {
        case TokenName.Ether:
        case TokenName.Doublon:
        case TokenName.Hell:
        case TokenName.Random:
            return 18;
        case TokenName.FUSD:
            return 6;
    }

    throw "You didn't provide a valid token name";
}

