import {ethers} from "hardhat";
import {Contract} from "ethers";
import {expect} from "chai";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";

describe('[Greed Starter] function initialize', async () => {
    let guest1Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        guest1Signer = accountSigners[1];
    });

    it('should already be initialized', async() => {
        const contract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(contract.initialize(guest1Signer.address, 100))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
});