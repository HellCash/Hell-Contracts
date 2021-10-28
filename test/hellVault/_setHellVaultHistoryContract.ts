import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";

export function _setHellVaultHistoryContract() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellVaultHistoryContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Vault Bonus Contract', async() => {
        await expect(environment.hellVaultContract
            ._setHellVaultHistoryContract(EtherUtils.zeroAddress()))
            .to.emit(environment.hellVaultContract, 'HellVaultHistoryContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}