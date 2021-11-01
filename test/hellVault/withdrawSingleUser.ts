import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {formatEther, parseEther} from "ethers/lib/utils";
import {BigNumber} from "ethers";
import {Random} from "../../utils/random";
import {getBlockNumber, NetworkUtils} from "../../utils/networkUtils";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";

export function withdrawSingleUser() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
        // Increase allowances
        await environment.hellContract.approve(environment.hellVaultContract.address, parseEther('25000'));
        const deposit1 = parseEther(Random.randomNumber(0.000001,20).toFixed(18));
        console.log(`\tPerforming a deposit of ${formatEther(deposit1)} (${deposit1} wei) at block ${await getBlockNumber()}`);
        await environment.expectDeposit(deposit1);

        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        const deposit2 = parseEther(Random.randomNumber(0.000001,20).toFixed(18));
        console.log(`\tPerforming a deposit of ${formatEther(deposit2)} (${deposit2} wei) at block ${await getBlockNumber()}`);
        await environment.expectDeposit(deposit2)

        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        const deposit3 = parseEther(Random.randomNumber(0.000001,20).toFixed(18));
        console.log(`\tPerforming a deposit of ${formatEther(deposit3)} (${deposit3} wei) at block ${await getBlockNumber()}`);
        await environment.expectDeposit(deposit3);
    });

    it('Should withdraw half', async() => {
        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        console.log(`\t[Before withdraw]`);
        const userData: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(environment.masterSigner.address);
        const expectedRewards = await environment.getExpectedRewards(environment.masterSigner.address, 1);
        const amountToWithdraw = userData.hellDeposited.div(2);
        await environment.logVaultAndUserInfo();
        await environment.expectWithdraw(amountToWithdraw);
        console.log(`\t[After withdraw]`);
        await environment.logVaultAndUserInfo();
    });

    it('Should withdraw all remaining', async() => {
        await NetworkUtils.mineBlocks(Random.randomIntegerNumber(1,200));
        console.log(`\t[Before withdraw]`);
        const userData: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(environment.masterSigner.address);
        const expectedRewards = await environment.getExpectedRewards(environment.masterSigner.address, 1);
        const amountToWithdraw = userData.hellDeposited;
        await environment.logVaultAndUserInfo();
        await environment.expectWithdraw(amountToWithdraw);
        console.log(`\t[After withdraw]`);
        await environment.logVaultAndUserInfo();
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