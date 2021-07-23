import {ethers} from "hardhat";
import {Contract} from "ethers";
import {expect} from "chai";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";

describe('[Hell] function initialize', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
    });
    it('should already be initialized', async() => {
        const contract: Contract = await HellTestHelpers.getHellContract(guest1Signer);
        await expect(contract.initialize([])).to.be
            .revertedWith("Initializable: contract is already initialized");
    });
});