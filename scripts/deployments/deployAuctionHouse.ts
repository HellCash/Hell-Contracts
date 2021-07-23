import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";

export async function deployAuctionHouse(treasuryAddress: string): Promise<Contract> {
    const auctionHouseContractProxy = await upgrades.deployProxy(
        await ethers.getContractFactory("AuctionHouse"),{kind: 'uups'});
    await Console.contractDeploymentInformation("AuctionHouse", auctionHouseContractProxy);
    console.log('Auction House Contract: Set Treasury Address to ' + treasuryAddress + ' with fees of 0.125%');
    await auctionHouseContractProxy._setTreasuryAddressAndFees(treasuryAddress, 800);
    return auctionHouseContractProxy;
}