import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";

export function _setHellVaultBonusAddress() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultHistoryContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultBonusAddress(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault Bonus Address', async() => {
        await expect(environment.hellVaultHistoryContract
            ._setHellVaultBonusAddress(environment.masterSigner.address))
            .to.emit(environment.hellVaultHistoryContract, 'HellVaultBonusAddressUpdated')
            .withArgs(environment.masterSigner.address);
    });
}