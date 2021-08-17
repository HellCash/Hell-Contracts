import {expect} from "chai";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {BigNumber} from "ethers";

export function _registerTrustedProject() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            ._registerTrustedProject(BigNumber.from("10")))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should register the project as Trusted', async() => {
        const projectId: BigNumber = BigNumber.from("15");
        // Expect that the project isn't marked as trusted yet
        expect(await environment.greedStarterIndexerContract._projectIsTrusted(projectId))
            .to.be.false;

        const totalTrustedProjects: BigNumber = await environment.greedStarterIndexerContract._totalTrustedProjects();
        await expect(environment.greedStarterIndexerContract
            ._registerTrustedProject(projectId))
            .to.emit(environment.greedStarterIndexerContract, "ProjectRegisteredAsTrusted")
            .withArgs(projectId);
        const afterTotalTrustedProjects: BigNumber = await environment.greedStarterIndexerContract._totalTrustedProjects();

        expect(totalTrustedProjects.add(1)).to.be.equal(afterTotalTrustedProjects);
        expect(await environment.greedStarterIndexerContract._trustedProjects(afterTotalTrustedProjects))
            .to.be.equal(projectId);
        // Expect that the project was marked as trusted
        expect(await environment.greedStarterIndexerContract._projectIsTrusted(projectId))
            .to.be.true;
    });
}