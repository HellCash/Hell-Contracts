import {ethers, upgrades} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {Console} from "../../utils/console";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import {ContractUtils} from "../../utils/contract-utils";

export async function deployAuctionHouse(treasuryAddress: string, minimumAuctionLength: number | BigNumber,
  maximumAuctionLength: number | BigNumber, auctionHouseFee: number, printLogs: boolean = true): Promise<Contract> {
    const auctionHouseContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouse"), [
            minimumAuctionLength, maximumAuctionLength, treasuryAddress, auctionHouseFee
        ],
        {kind: 'uups'}
    );
    if (printLogs) {
        const feePercentage = (1 / auctionHouseFee) * 100;
        Console.contractDeploymentInformation("AuctionHouse", auctionHouseContractProxy);
        console.log(`\t[Auction House Contract]: Minimum Auction Length ${minimumAuctionLength}`);
        console.log(`\t[Auction House Contract]: Set Treasury Address to ${treasuryAddress} with fees of ${feePercentage}%`);
    }

    // Initialize Implementation with gibberish values, so that the contract is left in an unusable state.
    // https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
    await ContractUtils.initializeImplementation(auctionHouseSol, auctionHouseContractProxy, [
        BigNumber.from(1), BigNumber.from(1), treasuryAddress, 1
    ], printLogs);

    return auctionHouseContractProxy;
}