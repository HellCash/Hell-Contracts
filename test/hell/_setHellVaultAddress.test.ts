import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
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

    it('Should update the Hell Vault Address', async() => {
        const newVaultAddress = environment.masterSigner.address;
        await expect(environment.hellContract._setHellVaultAddress(newVaultAddress))
            .to.emit(environment.hellContract, "HellVaultAddressUpdated")
            .withArgs(newVaultAddress);
        expect(await environment.hellContract._hellVaultAddress()).to.be.equal(newVaultAddress);
    });
}