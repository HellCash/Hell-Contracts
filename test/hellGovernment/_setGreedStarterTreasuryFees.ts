import {expect} from "chai";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function _setGreedStarterTreasuryFees() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setGreedStarterTreasuryFees(1000))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update Hell\'s Greed Starter treasury Fee', async() => {
        await expect(environment.hellGovernmentContract
            ._setGreedStarterTreasuryFees(1000))
            .to.emit(environment.hellGovernmentContract, 'GreedStarterTreasuryFeesUpdated')
            .withArgs(1000);
    });

}