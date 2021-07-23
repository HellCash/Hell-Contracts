import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import contractAddresses from "../../scripts/contractAddresses.json";

describe('[Hell] function _setExcludedFromBurnList', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
    });

    it('Should fail if not called by the owner', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1Signer);
        await expect(hellContract._setExcludedFromBurnList(guest1Signer.address, true))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should fail if the excluded address is the zero address', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract._setExcludedFromBurnList(EtherUtils.zeroAddress(), true))
            .to.be.revertedWith("Cannot exclude the zero address");
    });

    it('Should update the address exclusion', async() => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract._setExcludedFromBurnList(contractAddresses.hellVault, true))
            .to.emit(hellContract, "ExcludedFromBurnList")
            .withArgs(contractAddresses.hellVault, true);
    });

});