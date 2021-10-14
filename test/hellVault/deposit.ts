import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {BigNumber} from "ethers";
import {NetworkUtils} from "../../utils/networkUtils";
import {HellVaultTestingUtils} from "./@hellVaultTestingUtils";

export function deposit() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if deposit is less than 1e12', async() => {
        await expect(environment.hellVaultContract
            .deposit(parseUnits("1", 11)) // REVERT <-- we are providing 1e11
        ).to.be.revertedWith("D1");
    });

    it("Should fail if user doesn't have enough balance", async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // REVERT <-- guest1 has no balance
            .deposit(parseEther("1"))).to.be.revertedWith("DA2");
    });

    it("Should fail if user doesn't have enough allowance", async() => {
        await expect(environment.hellVaultContract
            .deposit(parseEther("1")) // REVERT <-- the masterSigner has no allowance.
        ).to.be.revertedWith("DA3");
    });

    it('Should perform a successful deposit with 1e12', async() => {
        const amount = parseUnits("1", 12);
        const vaultBalance: BigNumber = await environment.hellContract.balanceOf(environment.masterSigner.address);
        // Increase allowance
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        // perform a deposit
        await expect(environment.hellVaultContract
            .deposit(amount))
            .to.emit(environment.hellVaultContract, "Deposit")
            .withArgs(environment.masterSigner.address, amount);
        // TODO: Verify that the userInfo was updated successfully
    });

    it('Should perform a second deposit of 1 HELL after 100 blocks', async () => {
        const amount = parseEther("1");
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
        // Mine 100 blocks
        await NetworkUtils.mineBlocks(100);
        // Increase allowance
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        // Calculate current rewards
        const currentRewards = await environment.hellVaultContract
            .calculateUserRewards(environment.masterSigner.address);
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
        // Perform a deposit, by doing so the currentRewards should increase as well since 1 more block will be mined.
        await expect(environment.hellVaultContract
            .deposit(amount))
            .to.emit(environment.hellVaultContract, "Deposit")
            .withArgs(environment.masterSigner.address, amount);
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
    });

    it('Should perform a third deposit of 1 HELL after 100 blocks', async () => {
        const amount = parseEther("1");
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
        // Mine 100 blocks
        await NetworkUtils.mineBlocks(100);
        // Increase allowance
        await environment.hellContract.approve(environment.hellVaultContract.address, amount);
        // Calculate current rewards
        const currentRewards = await environment.hellVaultContract
            .calculateUserRewards(environment.masterSigner.address);
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
        // Perform a deposit, by doing so the currentRewards should increase as well since 1 more block will be mined.
        await expect(environment.hellVaultContract
            .deposit(amount))
            .to.emit(environment.hellVaultContract, "Deposit")
            .withArgs(environment.masterSigner.address, amount);
        await HellVaultTestingUtils.logVaultAndUserInfo(environment);
    });


}