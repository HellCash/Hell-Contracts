import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployHellGovernment} from "../../scripts/deployments/deployHellGovernment";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {deployHellVault} from "../../scripts/deployments/deployHellVault";
import {deployHell} from "../../scripts/deployments/deployHell";
import {formatEther} from "ethers/lib/utils";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";
import {HellVaultExpectedRewards} from "../../models/hellVaultExpectedRewards";
import {expect} from "chai";

export class HellVaultTestingEnvironment {
    // Account signers
    accountSigners: any[];
    masterSigner: any;
    treasurySigner: any;
    guest1Signer: any;
    guest2Signer: any;
    guest3Signer: any;
    // Proxy Contracts
    hellContract: Contract;
    hellGovernmentContract: Contract;
    hellVaultContract: Contract;
    // Initialize this testing environment
    async initialize() {
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', testingEnvironmentDeploymentOptions);
        this.hellGovernmentContract = await deployHellGovernment({
            treasuryAddress: this.treasurySigner.address,
            auctionHouseFee: 800, // 0.125%
            greedStarterFee: 100, // 1%
            minimumAuctionLength: BigNumber.from(100),
            maximumAuctionLength: BigNumber.from(4000000),
            minimumProjectLength: BigNumber.from(1000),
            maximumProjectLength: BigNumber.from(16000000),
            hellVaultTreasuryFee: 16, // 6.25%
        }, testingEnvironmentDeploymentOptions);
        this.hellVaultContract = await deployHellVault(this.hellContract.address, this.hellGovernmentContract.address, testingEnvironmentDeploymentOptions);
        await this.hellContract._setHellVaultAddress(this.hellVaultContract.address);
        await this.hellContract._setExcludedFromBurnList(this.hellVaultContract.address, true);
    };

    async logVaultInfo() {
        console.log(`\t\t[Vault Data]`);
        console.log(`\t\t\t_lastDividendBlock: ${await this.hellVaultContract._lastDividendBlock()}`);
        const dividendPeriodIndex = await this.hellVaultContract.getDividendPeriodIndex();
        console.log(`\t\t\t_dividendPeriodIndex: ${dividendPeriodIndex[1]} (Status ${dividendPeriodIndex[0]})`);
        console.log(`\t\t\t_distributedDividends: ${await this.hellVaultContract.getDistributedDividends()}`);
        const totalAmountDeposited = await this.hellVaultContract._totalAmountDeposited();
        console.log(`\t\t\t_totalAmountDeposited: ${formatEther(totalAmountDeposited)} (${totalAmountDeposited} wei)`);
    }

    async logUserData(signer: any | null = null) {
        if (signer == null) {
            signer = this.masterSigner;
        }
        console.log(`\t\t[User Data]`);
        const userData: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        console.log(`\t\t\tDeposited: ${formatEther(userData.hellDeposited)} (${userData.hellDeposited} wei)`);
        console.log(`\t\t\tLastDividend: ${userData.lastDividendBlock}`);
        console.log(`\t\t\tDistributedDividends: ${userData.distributedDividendsSinceLastPayment}`);
        console.log(`\t\t\t---------------------`);
        console.log(`\t\t\tRewards: ${formatEther(userData.hellRewarded)} (${userData.hellRewarded} wei)`);
        console.log(`\t\t\tWithdrawFee: ${formatEther(userData.hellRewardWithdrawFee)} (${userData.hellRewardWithdrawFee} wei)`);
        const rewardAfterFee = userData.hellRewarded.sub(userData.hellRewardWithdrawFee);
        console.log(`\t\t\tRewardAfterFee: ${formatEther(rewardAfterFee)} (${rewardAfterFee} wei)`);
    }

    async logVaultAndUserInfo(signer: any | null = null) {
        signer = signer ? signer : this.masterSigner;
        console.log(`\tBlock number: ${await ethers.provider.getBlockNumber()}`);
        console.log(`\tUser address: ${signer.address}`);
        await this.logVaultInfo();
        await this.logUserData(signer);
    }

    // Returns the expected rewards, fees and rewards after fees for the next block
    async getExpectedRewards(offset: number | BigNumber = 1, signer: any | null = null): Promise<HellVaultExpectedRewards> {
        signer = signer ? signer : this.masterSigner;
        const expectedRewards: BigNumber = await this.hellVaultContract.getUserRewards(signer.address, offset);
        const expectedFee: BigNumber = expectedRewards.div(await this.hellGovernmentContract._hellVaultTreasuryFee());
        const expectedRewardsAfterFees = expectedRewards.sub(expectedFee);
        return {
            expectedRewards: expectedRewards,
            expectedFee: expectedFee,
            expectedRewardsAfterFees: expectedRewardsAfterFees
        };
    }

    async expectDeposit(amount: BigNumber, signer: any | null = null) {
        signer = signer ? signer : this.masterSigner;
        // Retrieve current user balances
        const userBalance: BigNumber = await this.hellContract.balanceOf(signer.address);
        // Check if the user enough balance
        if (userBalance.lt(amount)) {
            throw `User: ${signer.address} doesn't have enough balance`;
        }
        // Retrieve the HellVault userInfo state before deposits
        const userInfoBefore: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Calculate expected rewards on the next transaction by adding an offset of 1 block.
        const expectedRewards: HellVaultExpectedRewards = await this.getExpectedRewards(1, signer);
        // Perform a deposit and expect that the Deposit event triggers with his corresponding params
        await expect(this.hellVaultContract.connect(signer)
            .deposit(amount)).to.emit(this.hellVaultContract, "Deposit")
            .withArgs(signer.address, amount);
        // Retrieve the HellVault userInfo after deposits
        const userInfoAfter: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Expect that the amount deposited had increased by the deposited amount and the pending RewardsAfterFees
        expect(userInfoAfter.hellDeposited).to.be
            .equal(userInfoBefore.hellDeposited.add(amount).add(expectedRewards.expectedRewardsAfterFees));
        // Expect that the user balance had decreased by the deposited amount
        expect(userBalance.sub(amount)).to.be.equal(await this.hellContract.balanceOf(signer.address));
        // TODO: Expect Vault balance increase
    }

}