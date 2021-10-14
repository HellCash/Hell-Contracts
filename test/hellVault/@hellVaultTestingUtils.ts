import {ethers} from "hardhat";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";
import {formatEther} from "ethers/lib/utils";

export class HellVaultTestingUtils {
    static async logVaultAndUserInfo(environment: HellVaultTestingEnvironment, signer: any | null = null) {
        if (signer == null) {
            signer = environment.masterSigner;
        }
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log(`\tBlock number: ${blockNumber}`);
        const userData: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(signer.address);
        console.log(`\t\t[Vault Data]`);
        console.log(`\t\t\t_lastDividendBlock: ${await environment.hellVaultContract._lastDividendBlock()}`);
        const dividendPeriodIndex = await environment.hellVaultContract._dividendPeriodIndex();
        console.log(`\t\t\t_dividendPeriodIndex: ${dividendPeriodIndex[1]} (Status ${dividendPeriodIndex[0]})`);
        const totalAmountDeposited = await environment.hellVaultContract._totalAmountDeposited();
        console.log(`\t\t\t_totalAmountDeposited: ${formatEther(totalAmountDeposited)} (${totalAmountDeposited} wei)`);
        console.log(`\t\t[User Data]`);
        console.log(`\t\t\tDeposited: ${formatEther(userData.hellDeposited)} (${userData.hellDeposited} wei)`);
        console.log(`\t\t\tLastDividend: ${userData.lastDividendBlock}`);
        console.log(`\t\t\tDistributedDividends: ${userData.distributedDividendsSinceLastPayment}`);
        console.log(`\t\t\t---------------------`);
        console.log(`\t\t\tRewards: ${formatEther(userData.hellRewarded)} (${userData.hellRewarded} wei)`);
        console.log(`\t\t\tWithdrawFee: ${formatEther(userData.hellRewardWithdrawFee)} (${userData.hellRewardWithdrawFee} wei)`);
        const rewardAfterFee = userData.hellRewarded.sub(userData.hellRewardWithdrawFee);
        console.log(`\t\t\tRewardAfterFee: ${formatEther(rewardAfterFee)} (${rewardAfterFee} wei)`);
    }
}