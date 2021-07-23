import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import contractAddresses from "../../scripts/contractAddresses.json";

describe('[Hell] function _setHellVaultAddress', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
    });

    it('Should fail if not called by the owner', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1Signer);
        await expect(hellContract._setHellVaultAddress(guest1Signer.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should fail if the new address is the zero address', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract._setHellVaultAddress(EtherUtils.zeroAddress())).to.be.revertedWith("The Hell Vault address cannot be the zero address");
    });

    it('Should update the Hell Vault Address', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract._setHellVaultAddress(contractAddresses.hellVault)).to.emit(hellContract, "HellVaultAddressUpdated").withArgs(contractAddresses.hellVault);
    });

});