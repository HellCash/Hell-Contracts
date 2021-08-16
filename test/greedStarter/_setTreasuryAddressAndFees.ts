import {expect} from "chai";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";

export async function _setTreasuryAddressAndFees() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer)
            ._setTreasuryAddressAndFees(environment.guest1Signer.address, 400))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address and his fees', async () => {
        await expect(environment.greedStarterContract
            ._setTreasuryAddressAndFees(environment.treasurySigner.address, 400))
            .to.emit(environment.greedStarterContract, "TreasuryAddressAndFeesUpdated")
            .withArgs(environment.treasurySigner.address, 400);
    });
}