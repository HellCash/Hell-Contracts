import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";

export function deposit() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if deposit is less than 1e12', async() => {
        expect(environment.hellVaultContract
            .deposit(parseUnits("1", 11)) // REVERT <-- we are providing 1e11
        ).to.be.revertedWith("D1");
    });

    it("Should fail if user doesn't have enough balance", async() => {
        expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // REVERT <-- guest1 has no balance
            .deposit(parseEther("1"))).to.be.revertedWith("DA2");
    });

    it("Should fail if user doesn't have enough allowance", async() => {
        expect(environment.hellVaultContract
            .deposit(parseEther("1")) // REVERT <-- the masterSigner has no allowance.
        ).to.be.revertedWith("DA3");
    });

    it('Should perform a successful deposit with 1e12', async() => {
        const depositAmount = parseUnits("1", 12);
        expect(environment.hellVaultContract
            .deposit(depositAmount))
            .to.emit(environment.hellVaultContract, "Deposit")
            .withArgs(environment.masterSigner.address, depositAmount);
        // TODO: Verify that the userInfo was updated successfully
    });
}