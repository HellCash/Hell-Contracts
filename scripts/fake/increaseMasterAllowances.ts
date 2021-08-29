import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {txConfirmation} from "../../utils/network-utils";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {contractAddresses} from "../../helpers/NetworkContractAddresses";
import {ethers} from "hardhat";

async function main() {
    const addresses = contractAddresses();
    const masterSigner = (await ethers.getSigners())[0];
    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
    const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);
    await txConfirmation('Approve HELL to AH', hellContract.approve(addresses.auctionHouse, parseEther('10000000')));
    await txConfirmation('Approve DOUBLON to AH', doublonContract.approve(addresses.auctionHouse, parseEther('10000000')));
    await txConfirmation('Approve FUSD to AH', fusdContract.approve(addresses.auctionHouse, parseUnits('100000000', 6)));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });