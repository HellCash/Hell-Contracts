import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";

export function _setHellVaultHistoryContract() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultBonusContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultHistoryContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault History Contract', async() => {
        await expect(environment.hellVaultBonusContract
            ._setHellVaultHistoryContract(environment.masterSigner.address))
            .to.emit(environment.hellVaultBonusContract, 'HellVaultHistoryContractUpdated')
            .withArgs(environment.masterSigner.address);
    });
}