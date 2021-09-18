import {expect} from "chai";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function _setGeneralPaginationLimit() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setGeneralPaginationLimit(40))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the general pagination limit', async() => {
        await expect(environment.hellGovernmentContract
            ._setGeneralPaginationLimit(40))
            .to.emit(environment.hellGovernmentContract, 'GeneralPaginationLimitUpdated')
            .withArgs(40);
    });

}