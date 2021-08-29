import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {EtherUtils} from "../../utils/ether-utils";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {contractAddresses} from "../../helpers/NetworkContractAddresses";
import {txConfirmation} from "../../utils/network-utils";

async function main() {
    const addresses = contractAddresses();
    const accountSigners = await ethers.getSigners();
    const masterSigner: any = accountSigners[0];
    const currentBlock: number = await ethers.provider.getBlockNumber();

    const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);
    // const minimumLength: BigNumber = await auctionHouseContract._minimumAuctionLength();

    await txConfirmation('Creating Hell Auction, sold against Ether',
        auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('2'), // Auction 10 worth of Hell
        EtherUtils.zeroAddress(), // Against Ether
        parseEther('12000'), // Bid Price
        parseEther("35000"), // Buyout price
        currentBlock + 2005));

    await txConfirmation('Creating Hell Auction, sold against FUSD',
        auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('1'), // Auction 20 worth of Hell
        addresses.fusd, // Against FUSD
        parseUnits('33000', 6), // Bid Price
        parseUnits('66000', 6), // Buyout price
        currentBlock + 2025));

    await txConfirmation('Creating Hell Auction, sold against FUSD',
        auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('1'), // Auction 1 worth of Hell
        addresses.fusd, // Against FUSD
        parseUnits('10000', 6), // Bid Price
        parseUnits('35000', 6), // Buyout price
        currentBlock + 2025));

    await txConfirmation('Creating Doublon Auction, sold against FUSD',
        auctionHouseContract.createAuction(
        addresses.doublon, // Auction Hell
        parseEther('20000'), // Auction 20000 worth of Doublon
        addresses.fusd, // Against FUSD
        parseUnits('50', 6), // Bid Price
        parseUnits('250', 6), // Buyout price
        currentBlock + 2225));

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });