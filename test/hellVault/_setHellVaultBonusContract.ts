import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";

export function _setHellVaultBonusContract() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultBonusContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault Bonus Contract', async() => {
        await expect(environment.hellVaultContract
            ._setHellVaultBonusContract(EtherUtils.zeroAddress()))
            .to.emit(environment.hellVaultContract, 'HellVaultBonusContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}