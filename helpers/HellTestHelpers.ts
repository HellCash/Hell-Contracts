import {Console} from "../utils/console";
import {utils as Utils} from "ethers/lib/ethers";
import {BigNumber, Contract, Signer} from "ethers";
import hellSol from "../artifacts/contracts/Hell.sol/Hell.json";
import contractAddresses from "../scripts/contractAddresses.json";
import {ethers} from "hardhat";

export class HellTestHelpers {

    static async getHellContract(accountSigner?: Signer) {
        return await ethers.getContractAt(hellSol.abi, contractAddresses.hell, accountSigner);
    }

    static async getTotalSupply() {
        Console.logHr();
        const hellContract = await this.getHellContract();
        let currentSupply = await hellContract.totalSupply();
        console.log('\tCurrent Supply:' + Utils.formatUnits(currentSupply, 18));
        Console.logHr();
    }

    static async transfer(accountSigner: Signer, amount: BigNumber, recipient: string) {
        Console.logHr();
        const signerAddress = await accountSigner.getAddress();
        const hellContract = await this.getHellContract(accountSigner);
        console.log("\ttransferring "+Utils.formatEther(amount)+" HELL (from: " + signerAddress + ") (to: "+recipient+")");
        await hellContract.transfer(recipient, amount);
        Console.logHr();
    }
}