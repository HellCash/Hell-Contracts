import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function _setTokenTrust() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setTokenTrust(EtherUtils.zeroAddress(), true))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the token trust', async() => {
        await expect(environment.hellGovernmentContract
            ._setTokenTrust(EtherUtils.zeroAddress(), true))
            .to.emit(environment.hellGovernmentContract, 'UpdatedTokenTrust')
            .withArgs(EtherUtils.zeroAddress(), true);
    });

}