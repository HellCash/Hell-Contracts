import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {formatEther, parseEther} from "ethers/lib/utils";
import {BigNumber} from "ethers";
import {Random} from "../../utils/random";
import {NetworkUtils} from "../../utils/networkUtils";
import {ClaimMode} from "../../enums/claimMode";

export function withdraw() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    let masterDeposit: BigNumber;
    let guest1Deposit: BigNumber;
    let guest2Deposit: BigNumber;

    before(async () => {
        await environment.initialize();
        masterDeposit = parseEther(Random.randomNumber(0.000001,20).toFixed(18));
        guest1Deposit = parseEther(Random.randomNumber(0.000001,5).toFixed(18));
        guest2Deposit = parseEther(Random.randomNumber(0.000001,16).toFixed(18));
        // Provide balances
        await environment.hellContract.transfer(environment.guest1Signer.address, guest1Deposit);
        await environment.hellContract.transfer(environment.guest2Signer.address, guest2Deposit);
        // Increase allowances
        await environment.hellContract.approve(environment.hellVaultContract.address, masterDeposit);
        await environment.hellContract.connect(environment.guest1Signer).approve(environment.hellVaultContract.address, guest1Deposit);
        await environment.hellContract.connect(environment.guest2Signer).approve(environment.hellVaultContract.address, guest2Deposit);
        // Perform a deposit with the master signer
        await environment.expectDeposit(masterDeposit);
        // Perform a deposit with guest1
        await environment.expectDeposit(guest1Deposit, environment.guest1Signer);
        // Perform a deposit with guest2
        await environment.expectDeposit(guest2Deposit, environment.guest2Signer);
    });

    it('Should fail if the user attempts to withdraw more funds than available', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest3Signer)
            .withdraw(parseEther("1"), ClaimMode.SendToWallet) // REVERT <-- guest3 doesn't have anything deposited
        ).to.be.revertedWith("W1");
    });

    it('(MasterSigner) Should perform a successful withdraw', async() => {
        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        console.log(`\t[Before withdraw: ${formatEther(masterDeposit)} (${masterDeposit} wei)]`);
        await environment.logVaultAndUserInfo();
        await environment.expectWithdraw(masterDeposit, environment.masterSigner);
        console.log(`\t[After withdraw: ${formatEther(masterDeposit)} (${masterDeposit} wei)]]`);
        await environment.logVaultAndUserInfo();
    });

    it('(Guest1) Should perform a successful withdraw', async() => {
        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        console.log(`\t[Before withdraw: ${formatEther(guest1Deposit)} (${guest1Deposit} wei)]`);
        await environment.logVaultAndUserInfo(environment.guest1Signer);
        await environment.expectWithdraw(guest1Deposit, environment.guest1Signer);
        console.log(`\t[After withdraw: ${formatEther(guest1Deposit)} (${guest1Deposit} wei)]`);
        await environment.logVaultAndUserInfo(environment.guest1Signer);
    });

    it('(Guest2) Should perform a successful withdraw', async() => {
        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        console.log(`\t[Before withdraw: ${formatEther(guest2Deposit)} (${guest2Deposit} wei)]`);
        await environment.logVaultAndUserInfo(environment.guest2Signer);
        await environment.expectWithdraw(guest2Deposit, environment.guest2Signer);
        console.log(`\t[After withdraw: ${formatEther(guest2Deposit)} (${guest2Deposit} wei)]`);
        await environment.logVaultAndUserInfo(environment.guest2Signer);
    });

    it('(HellVault) Should have a remaining balance of 0', async() => {
        const vaultBalance: BigNumber = await environment.hellContract.balanceOf(environment.hellVaultContract.address);
        console.log(`\tVault Balance: ${formatEther(vaultBalance)} | ${vaultBalance}`);
        expect(vaultBalance).to.be.equal(BigNumber.from(0));
    });

    it('(HellVault) Should have a Total Amount Deposited of 0', async() => {
        const totalAmountDeposited: BigNumber = await environment.hellVaultContract._totalAmountDeposited();
        console.log(`\tTotal amount Deposited: ${formatEther(totalAmountDeposited)} | ${totalAmountDeposited}`);
        expect(totalAmountDeposited).to.be.equal(BigNumber.from(0));
    });

    after(async() => {
        const treasuryBalance: BigNumber = await environment.hellContract.balanceOf(environment.treasurySigner.address);
        console.log(`\n\t\tTreasury Balance: ${formatEther(treasuryBalance)} | ${treasuryBalance} wei`);
    });
}