import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {EtherUtils} from "../../utils/ether-utils";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {Console} from "../../utils/console";
import {contractAddresses} from "../../helpers/NetworkContractAddresses";

async function main() {
    const addresses = contractAddresses();
    const accountSigners = await ethers.getSigners();
    const masterSigner: any = accountSigners[0];
    const currentBlock: number = await ethers.provider.getBlockNumber();
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
    const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);


    await hellContract.approve(addresses.auctionHouse, parseEther('10000000'));
    await doublonContract.approve(addresses.auctionHouse, parseEther('10000000'));
    await fusdContract.approve(addresses.auctionHouse, parseUnits('100000000',6));

    const auctionHouseContract: Contract = await AuctionTestHelpers.getAuctionContract(masterSigner);

    Console.logTitle('Creating Hell Auction, sold against Ether');
    await auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('10'), // Auction 10 worth of Hell
        EtherUtils.zeroAddress(), // Against Ether
        parseEther('10'), // Bid Price
        parseEther("500"), // Buyout price
        currentBlock + 2005);

    Console.logTitle('Creating Hell Auction, sold against FUSD');
    await auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('20'), // Auction 20 worth of Hell
        addresses.fusd, // Against FUSD
        parseUnits('330000', 6), // Bid Price
        parseUnits('660000', 6), // Buyout price
        currentBlock + 2025);

    Console.logTitle('Creating Hell Auction, sold against FUSD');
    await auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('1'), // Auction 1 worth of Hell
        addresses.fusd, // Against FUSD
        parseUnits('10000', 6), // Bid Price
        parseUnits('35000', 6), // Buyout price
        currentBlock + 2025);

    Console.logTitle('Creating Doublon Auction, sold against FUSD');
    await auctionHouseContract.createAuction(
        addresses.doublon, // Auction Hell
        parseEther('20000'), // Auction 20000 worth of Doublon
        addresses.fusd, // Against FUSD
        parseUnits('50', 6), // Bid Price
        parseUnits('250', 6), // Buyout price
        currentBlock + 2225);

    Console.logTitle('Creating Hell Auction, sold against ALPACA');
    await auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('10'), // Auction 10 worth of Hell
        '0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F', // Against Alpaca
        parseEther('150000'), // Bid Price
        parseEther('220000'), // Buyout price
        currentBlock + 2225);

    Console.logTitle('Creating Hell Auction, sold against XVS');
    await auctionHouseContract.createAuction(
        addresses.hell, // Auction Hell
        parseEther('10'), // Auction 10 worth of Hell
        '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', // Against XVS
        parseEther('550'), // Bid Price
        parseEther('650'), // Buyout price
        currentBlock + 2225);

    Console.logTitle('Creating Ether Auction, sold against Hell');
    await auctionHouseContract.createAuction(
        EtherUtils.zeroAddress(), // Auction Ether
        parseEther('250'), // Auction 10 worth of Ether
        addresses.hell, // Against Hell
        parseEther('5'), // Bid Price
        parseEther('10'), // Buyout price
        currentBlock + 2115, {value: parseEther('250')});

    Console.logTitle('Creating Ether Auction, sold against FUSD');
    await auctionHouseContract.createAuction(
        EtherUtils.zeroAddress(), // Auction Ether
        parseEther('250'), // Auction 10 worth of Ether
        addresses.fusd, // Against Hell
        parseUnits('55000', 6), // Bid Price
        parseUnits('82500', 6), // Buyout price
        currentBlock + 2155, {value: parseEther('250')});
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });