import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";

describe('[Hell] function mintVaultRewards', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
    });

    it('should fail if msg.sender isn\'t the Hell Vault', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract.mintVaultRewards(parseEther('100'))).to.be.revertedWith('Only the Hell Vault might trigger this function');
    });

});