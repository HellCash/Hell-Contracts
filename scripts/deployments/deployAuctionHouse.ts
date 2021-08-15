import {ethers, upgrades} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {Console} from "../../utils/console";

export async function deployAuctionHouse(treasuryAddress: string, minimumAuctionLength: BigNumber,
                                         auctionHouseFee: number, printLogs: boolean = true): Promise<Contract> {
    const auctionHouseContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouse"),[
            minimumAuctionLength, treasuryAddress, auctionHouseFee
        ],
        {kind: 'uups'}
    );
    if (printLogs) {
        const feePercentage = 1 / auctionHouseFee;
        Console.contractDeploymentInformation("AuctionHouse", auctionHouseContractProxy);
        console.log(`[Auction House Contract]: Minimum Auction Length ${minimumAuctionLength}`);
        console.log(`[Auction House Contract]: Set Treasury Address to ${treasuryAddress} with fees of ${feePercentage}%`);
    }
    return auctionHouseContractProxy;
}