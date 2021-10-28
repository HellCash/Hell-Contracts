import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";

export function _setHellGovernmentContract() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Government Contract', async() => {
        await expect(environment.hellVaultContract
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.emit(environment.hellVaultContract, 'HellGovernmentContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}