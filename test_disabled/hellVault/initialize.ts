import {ethers} from "hardhat";
import {Contract} from "ethers";
import {expect} from "chai";
import {HellVaultTestHelpers} from "../../helpers/HellVaultTestHelpers";
import contractAddresses from "../../scripts/contractAddresses.json";

describe('[Hell Vault] function initialize', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });
    it('should already be initialized', async() => {
        const contract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest1Signer);
        await expect(contract.initialize(contractAddresses.hell, treasurySigner.address)).to.be
            .revertedWith("Initializable: contract is already initialized");
    });
});