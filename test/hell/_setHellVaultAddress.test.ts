import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function _setHellVaultAddress() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellContract.connect(environment.guest1Signer)
            ._setHellVaultAddress(environment.guest1Signer.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should fail if the new address is the zero address', async() => {
        await expect(environment.hellContract._setHellVaultAddress(EtherUtils.zeroAddress())).to.be.revertedWith("The Hell Vault address cannot be the zero address");
    });

    // TODO: Update with the Hell vault Address when the Hell Vault contract is finished
    it('Should update the Hell Vault Address', async() => {
        await expect(environment.hellContract._setHellVaultAddress(environment.masterSigner.address))
            .to.emit(environment.hellContract, "HellVaultAddressUpdated")
            .withArgs(environment.masterSigner.address);
    });
}