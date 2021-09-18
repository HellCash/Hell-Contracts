import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function _setTreasuryAddress() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setTreasuryAddress(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address', async() => {
        await expect(environment.hellGovernmentContract
            ._setTreasuryAddress(environment.treasurySigner.address))
            .to.emit(environment.hellGovernmentContract, 'TreasuryAddressUpdated')
            .withArgs(environment.treasurySigner.address);
    });

}