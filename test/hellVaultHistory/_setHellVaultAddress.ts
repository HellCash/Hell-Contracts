import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";

export function _setHellVaultAddress() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultHistoryContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultAddress(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault Bonus Contract', async() => {
        await expect(environment.hellVaultHistoryContract
            ._setHellVaultAddress(environment.masterSigner.address))
            .to.emit(environment.hellVaultHistoryContract, 'HellVaultAddressUpdated')
            .withArgs(environment.masterSigner.address);
    });
}