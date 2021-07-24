import {BigNumber, Signer} from "ethers";
import {Console} from "../utils/console";
import {utils as Utils} from "ethers/lib/ethers";
import {RewardCalculationMode} from "../models/reward-calculation-mode.enum";
import {ClaimMode} from "../models/claim-mode.enum";
import {ethers} from "hardhat";
import contractAddresses from "../scripts/contractAddresses.json";
import hellVaultSol from "../artifacts/contracts/HellVault.sol/HellVault.json";
import {HellTestHelpers} from "./HellTestHelpers";

export class HellVaultTestHelpers {
    static async getHellVaultContract(accountSigner?: Signer) {
        return await ethers.getContractAt(hellVaultSol.abi, contractAddresses.hellVault, accountSigner);
    }

    static async depositHell(accountSigner: Signer, amount: BigNumber) {
        Console.logHr()
        const signerAddress = await accountSigner.getAddress();
        const hellContract = await HellTestHelpers.getHellContract(accountSigner);
        const vaultContract = await this.getHellVaultContract(accountSigner);
        console.log("\tdepositHell (from: " + signerAddress + ")");

        const userBalanceBefore: BigNumber = await hellContract.balanceOf(signerAddress);
        const vaultBalanceBefore: BigNumber = await vaultContract.getVaultHELLBalance();
        await vaultContract.depositHELL(amount);

        const userBalanceAfter: BigNumber = await hellContract.balanceOf(signerAddress);
        const vaultBalanceAfter: BigNumber = await vaultContract.getVaultHELLBalance();
        console.log("\t\tAmount to deposit: " + Utils.formatEther(amount));
        console.log("\t\tUser Balance:\n\t\t\tBefore Deposit: " + Utils.formatEther(userBalanceBefore) + '\n\t\t\tAfter Deposit: ' + Utils.formatEther(userBalanceAfter));
        console.log("\t\tVault Balance:\n\t\t\tBefore Deposit: " + Utils.formatEther(vaultBalanceBefore) + '\n\t\t\tAfter Deposit: ' + Utils.formatEther(vaultBalanceAfter));
        Console.logHr();
    }
    static async withdrawHell(accountSigner: Signer, amount: BigNumber) {
        Console.logHr();
        const signerAddress = await accountSigner.getAddress();
        const hellContract = await HellTestHelpers.getHellContract(accountSigner);
        const vaultContract = await this.getHellVaultContract(accountSigner);
        console.log("\twithdrawHell (from: " + signerAddress + ")");

        const userBalanceBefore: BigNumber = await hellContract.balanceOf(signerAddress);
        const vaultBalanceBefore: BigNumber = await vaultContract.getVaultHELLBalance();

        await vaultContract.withdrawHELL(amount);

        const userBalanceAfter: BigNumber = await hellContract.balanceOf(signerAddress);
        const vaultBalanceAfter: BigNumber = await vaultContract.getVaultHELLBalance();

        console.log("\tUser Balance:\n\t\tBefore withdraw: " + Utils.formatEther(userBalanceBefore) + '\n\t\tAfter withdraw: ' + Utils.formatEther(userBalanceAfter));
        console.log("\tVault Balance:\n\t\tBefore withdraw: " + Utils.formatEther(vaultBalanceBefore) + '\n\t\tAfter withdraw: ' + Utils.formatEther(vaultBalanceAfter));
        Console.logHr();
    }


    static async getDistributedDividends() {
        Console.logHr();
        const contract = await this.getHellVaultContract();
        let distributedDividends = (await contract.getDistributedDividends());
        let distributedDividendsData = "";
        for(let i = 0; i < distributedDividends.length; i++) {
            distributedDividendsData += "(" + i+": "+distributedDividends[i].toNumber() + "), ";
        }
        console.log("\tHell Distributed Dividends: " + distributedDividendsData);
        Console.logHr();
    }

    static async getUserInfo(accountSigner: Signer) {
        Console.logHr();
        console.log("\tgetUserInfo (from: " + await accountSigner.getAddress() + ")");
        const hellContract = await HellTestHelpers.getHellContract(accountSigner);
        const hellVault = await this.getHellVaultContract(accountSigner);
        const userInfo = await hellVault.getUserInfo();
        const realizedRewards = await hellVault._calculateUserRewards(await accountSigner.getAddress(), RewardCalculationMode.RealizedRewardsOnly);
        const unrealizedRewards = await hellVault._calculateUserRewards(await accountSigner.getAddress(), RewardCalculationMode.UnrealizedRewardsOnly);
        console.log("\t\tHell Balance: " + Utils.formatEther(await hellContract.balanceOf(await accountSigner.getAddress())));
        console.log("\t\tHell Deposited: " + Utils.formatEther(userInfo.hellDeposited));
        console.log("\t\tHell Rewards: " + Utils.formatEther(userInfo.hellRewarded));
        console.log("\t\tHell Rewards (Realized only): " + Utils.formatEther(realizedRewards));
        console.log("\t\tHell Rewards (Unrealized only): " + Utils.formatEther(unrealizedRewards));
        console.log("\t\tLast Dividend: " + userInfo.lastDividendBlock.toNumber());

        let periodData = "";
        if (userInfo.distributedDividendsSinceLastPayment.length > 0) {
            for(let i = 0; i < userInfo.distributedDividendsSinceLastPayment.length; i++) {
                periodData += "(" + i+": "+userInfo.distributedDividendsSinceLastPayment[i].toNumber() + "), ";
            }
        } else {
            periodData += "\t\tNone";
        }

        console.log("\t\tDividend Periods Since Last Deposit:\n\t\t" + periodData);
        Console.logHr();
    }
    static async getVaultInfo() {
        const hellVault = await this.getHellVaultContract();
        const hellContract = await HellTestHelpers.getHellContract();
        Console.logHr();
        let distributedDividends = (await hellVault.getDistributedDividends());
        let distributedDividendsData = "";
        for(let i = 0; i < distributedDividends.length; i++) {
            distributedDividendsData += "(" + i+": "+distributedDividends[i].toNumber() + "), ";
        }
        console.log("\tVault Information");
        console.log("\t\tName: " + await hellVault.name());
        console.log("\t\tTotal Supply: " + Utils.formatEther(await hellContract.totalSupply()));
        console.log("\t\tHELL Deposited (Without Rewards): " + Utils.formatEther(await hellVault.getVaultHELLDeposited()));
        console.log("\t\tHELL Balance: " + Utils.formatEther(await hellVault.getVaultHELLBalance()));
        console.log("\t\tLast Dividend Block: " +  await hellVault.getLastDividendBlock());
        console.log("\t\tDistributed Dividends: " + distributedDividendsData);
        const dividendIndex = await hellVault._dividendPeriodIndex();
        console.log("\t\tCurrent Dividend Index: "+ dividendIndex[1]);
        Console.logHr();
    }
    static async claimRewards(accountSigner: Signer, mode: ClaimMode) {
        Console.logHr();
        console.log("\tclaimRewards (from: " + await accountSigner.getAddress() + ")");
        const hellVault = await this.getHellVaultContract(accountSigner);
        console.log("\t\tMode: " + (mode == ClaimMode.SendToVault ? "Send to Vault" : "Send to Wallet"));
        await hellVault.claimRewards(mode);
        Console.logHr();
    }
}