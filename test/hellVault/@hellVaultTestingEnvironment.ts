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
import {ClaimMode} from "../../enums/claimMode";
import {deployHellVaultBonus} from "../../scripts/deployments/deployHellVaultBonus";
import {deployHellVaultHistory} from "../../scripts/deployments/deployHellVaultHistory";

export class HellVaultTestingEnvironment {
    minimumDepositAmount: BigNumber;
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
    hellVaultBonusContract: Contract;
    hellVaultHistoryContract: Contract;

    // Initialize this testing environment
    async initialize(hellInitialSupply: BigNumber = BigNumber.from(566)) {
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', hellInitialSupply, testingEnvironmentDeploymentOptions);
        this.hellGovernmentContract = await deployHellGovernment({
            treasuryAddress: this.treasurySigner.address,
            auctionHouseFee: 800, // 0.125%
            greedStarterFee: 100, // 1%
            minimumAuctionLength: BigNumber.from(100),
            maximumAuctionLength: BigNumber.from(4000000),
            minimumProjectLength: BigNumber.from(1000),
            maximumProjectLength: BigNumber.from(16000000),
            hellVaultTreasuryFee: 16, // 6.25%
            hellVaultCompounderFee: 5 // 20% of the Treasury fees
        }, testingEnvironmentDeploymentOptions);
        this.hellVaultContract = await deployHellVault(this.hellContract.address, this.hellGovernmentContract.address, testingEnvironmentDeploymentOptions);
        await this.hellContract._setHellVaultAddress(this.hellVaultContract.address);
        await this.hellContract._setExcludedFromBurnList(this.hellVaultContract.address, true);
        this.hellVaultBonusContract = await deployHellVaultBonus(this.hellVaultContract.address, testingEnvironmentDeploymentOptions);
        this.hellVaultHistoryContract = await deployHellVaultHistory(this.hellVaultContract.address, this.hellVaultBonusContract.address, testingEnvironmentDeploymentOptions);
        await this.hellVaultContract._setHellVaultBonusContract(this.hellVaultBonusContract.address);
        await this.hellVaultContract._setHellVaultHistoryContract(this.hellVaultHistoryContract.address);
        this.minimumDepositAmount = await this.hellVaultContract._minimumDeposit();
    };

    async logVaultInfo() {
        console.log(`\t\t[Vault Data]`);
        console.log(`\t\t\t_lastDividendBlock: ${await this.hellVaultContract._lastDividendBlock()}`);
        const dividendPeriodIndex = await this.hellVaultContract.getDividendPeriodIndex();
        console.log(`\t\t\t_dividendPeriodIndex: ${dividendPeriodIndex[1]} (Status ${dividendPeriodIndex[0]})`);
        console.log(`\t\t\t_distributedDividends: ${await this.hellVaultContract.getDistributedDividends()}`);
        const totalAmountDeposited = await this.hellVaultContract._totalAmountDeposited();
        console.log(`\t\t\t_totalAmountDeposited: ${formatEther(totalAmountDeposited)} (${totalAmountDeposited} wei)`);
        const vaultBalance = await this.hellContract.balanceOf(this.hellVaultContract.address);
        console.log(`\t\t\tBalance: ${formatEther(vaultBalance)} (${vaultBalance} wei)`);
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
        const userBalance = await this.hellContract.balanceOf(signer.address);
        console.log(`\t\t\tWalletBalance: ${formatEther(userBalance)} (${userBalance} wei)`);
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
    async getExpectedRewards(userAddress: string, offset: number | BigNumber = 1): Promise<HellVaultExpectedRewards> {
        const expectedRewards: BigNumber = await this.hellVaultContract.getUserRewards(userAddress, offset);
        let expectedTreasuryFee: BigNumber = expectedRewards.div(await this.hellGovernmentContract._hellVaultTreasuryFee());
        const expectedRewardsAfterFees = expectedRewards.sub(expectedTreasuryFee);
        const expectedCompounderFee: BigNumber = expectedTreasuryFee.div(await this.hellGovernmentContract._hellVaultCompounderFee());
        // Subtract compounder fees from treasury fees
        expectedTreasuryFee = expectedTreasuryFee.sub(expectedCompounderFee);
        return {
            expectedRewards: expectedRewards,
            expectedTreasuryFee: expectedTreasuryFee,
            expectedRewardsAfterFees: expectedRewardsAfterFees,
            expectedCompounderFee: expectedCompounderFee,
        };
    }

    async expectDeposit(amount: BigNumber, signer: any = this.masterSigner, claimMode = ClaimMode.SendToVault) {
        // Retrieve current user balance
        const beforeUserBalance: BigNumber = await this.hellContract.balanceOf(signer.address);
        // Retrieve current vault balances
        const beforeVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
        const beforeTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
        // Check if the user enough balance
        if (beforeUserBalance.lt(amount)) {
            throw `User: ${signer.address} doesn't have enough balance`;
        }
        // Retrieve the Treasury Address balance
        const beforeTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Retrieve the HellVault userInfo state before deposits
        const beforeUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Calculate expected rewards on the next transaction by adding an offset of 1 block.
        const expectedRewards: HellVaultExpectedRewards = await this.getExpectedRewards(signer.address, 1);
        // Perform a deposit and expect that the Deposit event triggers with his corresponding params
        await expect(this.hellVaultContract.connect(signer)
            .deposit(amount, claimMode)).to.emit(this.hellVaultContract, "Deposit")
            .withArgs(signer.address, amount);
        // Retrieve the HellVault userInfo after the deposit
        const afterUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Retrieve after user balance
        const afterUserBalance: BigNumber = await this.hellContract.balanceOf(signer.address);
        // Retrieve the Treasury Address after the deposit
        const afterTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Expect that the amount deposited had increased by the deposited amount and the pending RewardsAfterFees
        expect(afterUserInfo.hellDeposited).to.be
            .equal(beforeUserInfo.hellDeposited.add(amount)
                .add(expectedRewards.expectedRewardsAfterFees)
                // Since the user will be the compounder by himself, he gets the compounder fee
                .add(expectedRewards.expectedCompounderFee)
            );
        // Expect that the user balance had decreased by the deposited amount
        expect(beforeUserBalance.sub(amount)).to.be.equal(afterUserBalance);
        // Expect that the treasury had received the proper amount of fees
        expect(afterTreasuryBalance).to.be.equal(beforeTreasuryBalance.add(expectedRewards.expectedTreasuryFee));
        // Retrieve Hell vault balances after the deposit
        const afterVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
        const afterTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
        // Expect that the vault balance registered on the Hell Contract had Increased by the amount and any pending rewards
        expect(afterVaultBalance).to.be
           .equal(beforeVaultBalance.add(amount)
               .add(expectedRewards.expectedRewardsAfterFees)
               // Since the user will be compounding the rewards by himself
               .add(expectedRewards.expectedCompounderFee));
        // // Expect that the vault balance _totalAmountDeposited had increased by the amount and any pending rewards
        expect(afterTotalAmountDeposited).to.be
            .equal(beforeTotalAmountDeposited.add(amount)
                .add(expectedRewards.expectedRewardsAfterFees)
                // Since the user will be compounding the rewards by himself
                .add(expectedRewards.expectedCompounderFee)
            );
    }

    async expectWithdraw(amount: BigNumber, signer: any | null = null) {
        signer = signer ? signer : this.masterSigner;
        // Retrieve current user balance
        const beforeUserBalance: BigNumber = await this.hellContract.balanceOf(signer.address);
        // Retrieve current vault balances
        const beforeVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
        const beforeTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
        // Retrieve the Treasury Address balance
        const beforeTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Retrieve the HellVault userInfo state before withdraws
        const beforeUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Calculate expected rewards on the next transaction by adding an offset of 1 block.
        const expectedRewards: HellVaultExpectedRewards = await this.getExpectedRewards(signer.address, 1);
        // Perform a withdraw and expect that the Withdraw event triggers with his corresponding params
        await expect(this.hellVaultContract.connect(signer)
            .withdraw(amount)).to.emit(this.hellVaultContract, "Withdraw")
            .withArgs(signer.address, amount);
        // Retrieve user balance after withdraw
        const afterUserBalance: BigNumber = await this.hellContract.balanceOf(signer.address);
        expect(afterUserBalance).to.be.equal(beforeUserBalance.add(amount)
            .add(expectedRewards.expectedRewardsAfterFees)
            // Since the user will be the compounder by himself, he gets the compounder fee
            .add(expectedRewards.expectedCompounderFee));
        // Retrieve the HellVault userInfo state after withdraws
        const afterUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(signer.address);
        // Retrieve the Treasury Address after the withdraw
        const afterTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Expect that the hell deposited for the user had be reduced by the amount
        expect(beforeUserInfo.hellDeposited.sub(amount)).to.be.equal(afterUserInfo.hellDeposited);
        // Expect that the treasury had received the proper amount of fees
        expect(afterTreasuryBalance).to.be.equal(beforeTreasuryBalance.add(expectedRewards.expectedTreasuryFee));
        // Retrieve Hell vault balances after the deposit
        const afterVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
        const afterTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
        // Expect that the vault balance registered on the Hell Contract had Decreased by the amount
        expect(afterVaultBalance).to.be
            .equal(beforeVaultBalance.sub(amount));
        // // Expect that the vault balance _totalAmountDeposited had increased by the amount
        expect(afterTotalAmountDeposited).to.be
            .equal(beforeTotalAmountDeposited.sub(amount));
    }

    async expectClaimRewards(userAddress: string, claimMode: ClaimMode, bankerSigner: any = this.masterSigner) {
        // Retrieve current user balance
        const beforeUserBalance: BigNumber = await this.hellContract.balanceOf(userAddress);
        // Retrieve the HellVault userInfo
        const beforeUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(userAddress);
        // Retrieve banker's balance
        const beforeBankerBalance: BigNumber = await this.hellContract.balanceOf(bankerSigner.address);
        // Retrieve the Treasury Address balance
        const beforeTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Retrieve current vault balances
        const beforeVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
        const beforeTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
        // Calculate expected rewards on the next transaction by adding an offset of 1 block.
        const expectedRewardsInfo: HellVaultExpectedRewards = await this.getExpectedRewards(userAddress, 1);
        let expectedRewardsAfterFees = expectedRewardsInfo.expectedRewardsAfterFees;
        let treasuryFee = expectedRewardsInfo.expectedTreasuryFee;
        let compounderFee = expectedRewardsInfo.expectedCompounderFee;
        // If the user address is the same as the signer address
        // the user should receive the compounder fees
        if (userAddress == bankerSigner.address) {
            // console.log('userAddress same as signer address');
            expectedRewardsAfterFees = expectedRewardsAfterFees.add(expectedRewardsInfo.expectedCompounderFee);
            compounderFee = BigNumber.from(0);
            // If the user isn't the userAddress use his preferred claim mode
        } else {
            // console.log('userAddress different from signer, use user preferred claim mode');
            claimMode = beforeUserInfo.claimMode;
        }

        await expect(this.hellVaultContract.connect(bankerSigner)
            .claimRewards(userAddress, claimMode))
            .to.emit(this.hellVaultContract, "ClaimRewards")
            .withArgs(userAddress, bankerSigner.address, claimMode, expectedRewardsAfterFees, treasuryFee, compounderFee);

        if (claimMode == ClaimMode.SendToWallet) {
            const afterUserBalance: BigNumber = await this.hellContract.balanceOf(userAddress);
            // Expect proper user balance updates
            expect(beforeUserBalance.add(expectedRewardsAfterFees)).to.be.equal(afterUserBalance);
        }

        if (claimMode == ClaimMode.SendToVault) {
            const afterUserInfo: HellVaultUserInfo = await this.hellVaultContract.getUserInfo(userAddress);
            const afterVaultBalance: BigNumber = await this.hellContract.balanceOf(this.hellVaultContract.address);
            const afterTotalAmountDeposited: BigNumber = await this.hellVaultContract._totalAmountDeposited();
            // Expect user info Hell deposited update
            expect(beforeUserInfo.hellDeposited.add(expectedRewardsAfterFees)).to.be.equal(afterUserInfo.hellDeposited);
            // Expect Vault balance update
            expect(beforeVaultBalance.add(expectedRewardsAfterFees)).to.be.equal(afterVaultBalance);
            // Expect Vault amount deposited update
            expect(beforeTotalAmountDeposited.add(expectedRewardsAfterFees)).to.be.equal(afterTotalAmountDeposited);
        }

        const afterTreasuryBalance: BigNumber = await this.hellContract.balanceOf(this.treasurySigner.address);
        // Expect Treasury fees received
        expect(beforeTreasuryBalance.add(treasuryFee)).to.be.equal(afterTreasuryBalance);

        if (userAddress != bankerSigner.address) {
            const afterBankerBalance = await this.hellContract.balanceOf(bankerSigner.address);
            // Expect Banker fees received
            expect(beforeBankerBalance.add(compounderFee)).to.be.equal(afterBankerBalance);
        }
    }

}