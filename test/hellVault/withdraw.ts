import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";

export function withdraw() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if the user tries to withdraw more funds than what he has available', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer)
            .withdraw(parseEther("1")) // REVERT <-- guest1 doesn't have anything deposited
        ).to.be.revertedWith("W1");
    });

    it('Should perform a successful withdraw', async() => {
        const amount = parseUnits("1", 12);
        await expect(environment.hellVaultContract
            .withdraw(amount))
            .to.emit(environment.hellVaultContract, "Withdraw")
            .withArgs(environment.masterSigner.address, amount);
        // TODO: Verify that the userInfo was updated successfully
    });
}