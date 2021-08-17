import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {expect} from "chai";
import {BigNumber} from "ethers";

export function _removeFromTrustedProjects() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    let projectIndex: BigNumber;
    let projectId: BigNumber;
    before(async () => {
        await environment.initialize();
        projectId = BigNumber.from('254');
        await environment.greedStarterIndexerContract._registerTrustedProject(projectId);
        projectIndex = await environment.greedStarterIndexerContract._totalTrustedProjects();
        // Expect that the project was marked as trusted
        expect(await environment.greedStarterIndexerContract._projectIsTrusted(projectId)).to.be.true;
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            ._removeFromTrustedProjects(projectIndex))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should remove the project from the Trusted list', async() => {
        await expect(environment.greedStarterIndexerContract
            ._removeFromTrustedProjects(projectIndex))
            .to.emit(environment.greedStarterIndexerContract, 'ProjectRemovedFromTrustedProjects')
            .withArgs(projectId, projectIndex);

        expect(await environment.greedStarterIndexerContract._projectIsTrusted(projectId)).to.be.false;
        expect(await environment.greedStarterIndexerContract._trustedProjects(projectIndex)).to.be.equal(BigNumber.from(0));
    });
}