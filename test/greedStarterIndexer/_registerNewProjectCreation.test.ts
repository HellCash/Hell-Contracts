import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {expect} from "chai";
import {BigNumber} from "ethers";

export function _registerNewProjectCreation() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the Greed Starter contract
        await environment.greedStarterIndexerContract
            ._setGreedStarterContractAddress(environment.masterSigner.address);
    });

    it('Should fail if not called by the Greed Starter Contract', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            ._registerNewProjectCreation(
                BigNumber.from(10), // projectId
                environment.guest1Signer.address, // creatorAddress
                )
        ).to.be.revertedWith("Forbidden");
    });

    it('Should register the project creation index', async() => {
        const newProjectId: BigNumber = BigNumber.from(10);
        const currentUserTotalProjects: BigNumber = await environment.greedStarterIndexerContract._userTotalProjects(environment.masterSigner.address);
        await expect(environment.greedStarterIndexerContract._registerNewProjectCreation(
            newProjectId, // projectId
            environment.masterSigner.address, // creatorAddress
        )).to.not.be.reverted;
        const afterUserTotalProjects: BigNumber = await environment.greedStarterIndexerContract._userTotalProjects(environment.masterSigner.address);
        // Verify that the userTotalProjects had increased
        expect(currentUserTotalProjects.add(1)).to.be.equal(afterUserTotalProjects);
        // Verify that the last registered index has the correct identifier
        const lastRegisteredId = await environment.greedStarterIndexerContract._userProjects(environment.masterSigner.address, afterUserTotalProjects);
        expect(lastRegisteredId).to.be.equal(newProjectId);
    });
}