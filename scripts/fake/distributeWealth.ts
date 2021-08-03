import {Contract} from "ethers";
import {ethers} from "hardhat"
import {parseEther, parseUnits} from "ethers/lib/utils";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {Console} from "../../utils/console";

async function main() {
    const signers = await ethers.getSigners();
    const masterSigner: any = signers[0];
    const guest1Signer: any = signers[1];
    const guest2Signer: any = signers[2];
    const guest4Signer: any = signers[4];

    const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
    const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
    const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);

    Console.logTitle('Distributing Wealth among signers 1, 2 and 4');
    await hellContract.transfer(guest1Signer.address, parseEther("20"));
    await hellContract.transfer(guest2Signer.address, parseEther("15"));
    await hellContract.transfer(guest4Signer.address, parseEther("23"));
    await doublonContract.transfer(guest1Signer.address, parseEther("10000"));
    await doublonContract.transfer(guest2Signer.address, parseEther("23000"));
    await doublonContract.transfer(guest4Signer.address, parseEther("34000"));
    await fusdContract.transfer(guest1Signer.address, parseUnits("134000", 6));
    await fusdContract.transfer(guest2Signer.address, parseUnits("55000", 6));
    await fusdContract.transfer(guest4Signer.address, parseUnits("90000", 6));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });