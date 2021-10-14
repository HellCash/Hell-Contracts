import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {BigNumber} from "ethers";

export function withdraw() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    let masterSignerDeposit: BigNumber;

    before(async () => {
        await environment.initialize();
        masterSignerDeposit = parseUnits("1", 12);
        // Perform a deposit with the master signer
        await environment.hellContract.approve(environment.hellVaultContract.address, masterSignerDeposit);
        await expect(environment.hellVaultContract
            .deposit(masterSignerDeposit))
            .to.emit(environment.hellVaultContract, "Deposit")
            .withArgs(environment.masterSigner.address, masterSignerDeposit);
    });

    it('Should fail if the user attempts to withdraw more funds than what he has available', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer)
            .withdraw(parseEther("1")) // REVERT <-- guest1 doesn't have anything deposited
        ).to.be.revertedWith("W1");
    });

    it('Should perform a successful withdraw', async() => {
        const balanceBefore: BigNumber = await environment.hellContract.balanceOf(environment.masterSigner.address);
        await expect(environment.hellVaultContract
            .withdraw(masterSignerDeposit))
            .to.emit(environment.hellVaultContract, "Withdraw")
            .withArgs(environment.masterSigner.address, masterSignerDeposit);
        // TODO: Consider rewarded Hell on balanceAfter
        const balanceAfter: BigNumber = await environment.hellContract.balanceOf(environment.masterSigner.address);
        expect(balanceBefore.add(masterSignerDeposit)).to.be.equal(balanceAfter);
        // TODO: Verify that the userInfo was updated successfully
    });
}