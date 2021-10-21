import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {NetworkUtils} from "../../utils/networkUtils";
import {ClaimMode} from "../../enums/claimMode";

export function deposit() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // Give Guest1 10 HELL
        environment.hellContract.transfer(environment.guest1Signer.address, parseEther('10'));
    });

    it('Should fail if deposit is less than 1e12', async() => {
        await expect(environment.hellVaultContract
            .deposit(parseUnits("1", 11), ClaimMode.SendToVault) // REVERT <-- we are providing 1e11
        ).to.be.revertedWith("D1");

        await expect(environment.hellVaultContract
            .deposit(parseUnits("1", 12).sub(1), ClaimMode.SendToVault) // REVERT <-- we are providing 1e12 - 1
        ).to.be.revertedWith("D1");
    });

    it("Should fail if user doesn't have enough balance", async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest2Signer) // REVERT <-- guest2 has no balance
            .deposit(parseEther("1"), ClaimMode.SendToVault)).to.be.revertedWith("DA2");

        await expect(environment.hellVaultContract
            .connect(environment.masterSigner) // REVERT <-- masterSigner doesn't have enough balance
            .deposit(parseEther("1000"), ClaimMode.SendToVault)).to.be.revertedWith("DA2");
    });

    it("Should fail if user doesn't have enough allowance", async() => {
        await expect(environment.hellVaultContract
            .deposit(parseEther("1"), ClaimMode.SendToVault) // REVERT <-- the masterSigner has no allowance.
        ).to.be.revertedWith("DA3");

        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer)
            .deposit(parseEther("1"), ClaimMode.SendToVault) // REVERT <-- the guest1 has no allowance.
        ).to.be.revertedWith("DA3");
    });

    it('(MasterSigner) Should deposit 1e12 HELL', async() => {
        const amount = parseUnits("1", 12);
        console.log('\t[Before deposit]');
        await environment.logVaultAndUserInfo();
        // Increase allowance
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        // Perform a deposit
        await environment.expectDeposit(amount);
        console.log('\t[After deposit]');
        await environment.logVaultAndUserInfo();
    });

    it('(Guest1) Should deposit 1.5 HELL after 50 blocks', async () => {
        const amount = parseEther('1.5');
        // Mine 50 blocks
        await NetworkUtils.mineBlocks(50);
        // Increase allowance
        await environment.hellContract.connect(environment.guest1Signer)
            .approve(environment.hellVaultContract.address, amount);
        console.log('\t[Before deposit]');
        await environment.logVaultAndUserInfo(environment.guest1Signer);
        // Perform a deposit
        await environment.expectDeposit(amount, environment.guest1Signer);
        console.log('\t[After deposit]');
        await environment.logVaultAndUserInfo(environment.guest1Signer);
    });

    it('(MasterSigner) Should deposit 1 HELL after 100 blocks while claiming pending rewards', async () => {
        const amount = parseEther('1');
        // Mine 100 blocks
        await NetworkUtils.mineBlocks(100);
        // Increase allowances
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        console.log('\t[Before deposit]');
        await environment.logVaultAndUserInfo();
        // Perform a deposit
        await environment.expectDeposit(amount);
        console.log('\t[After deposit]');
        await environment.logVaultAndUserInfo();
    });

    it('(Guest1) Should deposit 3.5 HELL after 210 blocks', async () => {
        const amount = parseEther('3.5');
        // Mine 210 blocks
        await NetworkUtils.mineBlocks(210);
        // Increase allowance
        await environment.hellContract
            .connect(environment.guest1Signer)
            .approve(environment.hellVaultContract.address, amount);
        console.log('\t[Before deposit]');
        await environment.logVaultAndUserInfo(environment.guest1Signer);
        // Perform a deposit
        await environment.expectDeposit(amount, environment.guest1Signer);
        console.log('\t[After deposit]');
        await environment.logVaultAndUserInfo(environment.guest1Signer);
    });

    it('(MasterSigner) Should deposit 5 HELL after 350 blocks while claiming pending rewards', async () => {
        const amount = parseEther('5');
        // Mine 350 blocks
        await NetworkUtils.mineBlocks(350);
        // Increase allowances
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        console.log('\t[Before deposit]');
        await environment.logVaultAndUserInfo();
        // Perform a deposit
        await environment.expectDeposit(amount);
        console.log('\t[After deposit]');
        await environment.logVaultAndUserInfo();
    });


}