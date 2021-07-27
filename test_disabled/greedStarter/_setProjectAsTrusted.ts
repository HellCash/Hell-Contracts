import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";

describe('[Greed Starter] function _setProjectAsTrusted', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });

    it('Should fail if not called by the owner', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract._setProjectAsTrusted(BigNumber.from(1)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should set the project as Trusted', async() => {
        // const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        // const projectId = BigNumber.from(1);
        // await expect(greedStarterContract._setProjectAsTrusted(projectId))
        //     .to.emit(greedStarterContract, "ProjectMarkedAsTrusted").withArgs(projectId);
        throw "Not Implemented";
    });
});