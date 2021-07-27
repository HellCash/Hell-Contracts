import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";

describe('[Greed Starter] function _removeFromTrustedProjects', async () => {
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
        await expect(greedStarterContract._removeFromTrustedProjects(BigNumber.from(1)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should remove the project from the trusted projects', async() => {
        // const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        // const projectIndex = BigNumber.from(1);
        // await expect(greedStarterContract._removeFromTrustedProjects(projectIndex))
        //     .to.emit(greedStarterContract, "ProjectRemovedFromTrustedProjects")
        //     .withArgs(projectId, projectIndex);
        throw "Not implemented";
    });
});