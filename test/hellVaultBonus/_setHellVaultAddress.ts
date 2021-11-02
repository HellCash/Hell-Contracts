import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";

export function _setHellVaultAddress() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultBonusContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultAddress(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault Address', async() => {
        await expect(environment.hellVaultBonusContract
            ._setHellVaultAddress(environment.masterSigner.address))
            .to.emit(environment.hellVaultBonusContract, 'HellVaultAddressUpdated')
            .withArgs(environment.masterSigner.address);
    });
}