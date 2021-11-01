import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {ClaimMode} from "../../enums/claimMode";
import {parseEther} from "ethers/lib/utils";
import {Random} from "../../utils/random";
import {BigNumber} from "ethers";
import {NetworkUtils} from "../../utils/networkUtils";

export function claimRewards() {
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
        // Update guest2 Claim mode to SendToWallet
        await environment.hellVaultContract.connect(environment.guest2Signer)
            .updateClaimMode(ClaimMode.SendToWallet);
        // Mine 100 blocks
        await NetworkUtils.mineBlocks(100);
    });

    it("Should fail if the user doesn't have rewards available to claim", async() => {
        await expect(environment.hellVaultContract
            .claimRewards(
                environment.guest3Signer.address, // REVERT: Guest3 has no deposits nor rewards
                ClaimMode.SendToWallet)
            ).to.be.revertedWith('CR1');
    });

    it('[Guest1] Should claim his own rewards with a different Claim mode', async() => {
        // By Default Guest1 has a claimMode of "Send To Vault" so we'll test with "Send to Wallet"
        await environment.expectClaimRewards(environment.guest1Signer.address, ClaimMode.SendToWallet, environment.guest1Signer);
    });

    it('[Guest3] Should claim Guest2 rewards with his preferred claim mode', async() => {
        await environment.expectClaimRewards(environment.guest2Signer.address, ClaimMode.SendToVault, environment.guest3Signer);
    });
    
}