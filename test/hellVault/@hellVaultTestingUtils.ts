import {ethers} from "hardhat";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";
import {formatEther} from "ethers/lib/utils";

export class HellVaultTestingUtils {
    static async logVaultInfo(environment: HellVaultTestingEnvironment) {
        console.log(`\t\t[Vault Data]`);
        console.log(`\t\t\t_lastDividendBlock: ${await environment.hellVaultContract._lastDividendBlock()}`);
        const dividendPeriodIndex = await environment.hellVaultContract.getDividendPeriodIndex();
        console.log(`\t\t\t_dividendPeriodIndex: ${dividendPeriodIndex[1]} (Status ${dividendPeriodIndex[0]})`);
        console.log(`\t\t\t_distributedDividends: ${await environment.hellVaultContract.getDistributedDividends()}`);
        const totalAmountDeposited = await environment.hellVaultContract._totalAmountDeposited();
        console.log(`\t\t\t_totalAmountDeposited: ${formatEther(totalAmountDeposited)} (${totalAmountDeposited} wei)`);
    }

    static async logUserData(environment: HellVaultTestingEnvironment, signer: any | null = null) {
        if (signer == null) {
            signer = environment.masterSigner;
        }
        console.log(`\t\t[User Data]`);
        const userData: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(signer.address);
        console.log(`\t\t\tDeposited: ${formatEther(userData.hellDeposited)} (${userData.hellDeposited} wei)`);
        console.log(`\t\t\tLastDividend: ${userData.lastDividendBlock}`);
        console.log(`\t\t\tDistributedDividends: ${userData.distributedDividendsSinceLastPayment}`);
        console.log(`\t\t\t---------------------`);
        console.log(`\t\t\tRewards: ${formatEther(userData.hellRewarded)} (${userData.hellRewarded} wei)`);
        console.log(`\t\t\tWithdrawFee: ${formatEther(userData.hellRewardWithdrawFee)} (${userData.hellRewardWithdrawFee} wei)`);
        const rewardAfterFee = userData.hellRewarded.sub(userData.hellRewardWithdrawFee);
        console.log(`\t\t\tRewardAfterFee: ${formatEther(rewardAfterFee)} (${rewardAfterFee} wei)`);
    }

    static async logVaultAndUserInfo(environment: HellVaultTestingEnvironment, signer: any | null = null) {
        console.log(`\tBlock number: ${await ethers.provider.getBlockNumber()}`);
        await this.logVaultInfo(environment);
        await this.logUserData(environment, signer);
    }
}