import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {expect} from "chai";
import {BigNumber} from "ethers";

export function _registerUserParticipation() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the Greed Starter contract
        await environment.greedStarterIndexerContract
            ._setGreedStarterContractAddress(environment.masterSigner.address);
    });

    it('Should fail if not called by the Greed Starter Contract', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            ._registerUserParticipation(BigNumber.from(10), environment.guest1Signer.address))
            .to.be.revertedWith("Forbidden");
    });

    let projectId: BigNumber;
    let userAddress: string;
    it('Should register the user participation', async () => {
        projectId = BigNumber.from(20);
        userAddress = environment.guest3Signer.address;

        // expect that the user hasn't participated yet
        expect(await environment.greedStarterIndexerContract
            ._userParticipatedInProject(userAddress, projectId))
            .to.be.false;

        const userTotalParticipatedProjects: BigNumber = await environment.greedStarterIndexerContract
            ._userTotalParticipatedProjects(userAddress);

        await expect(environment.greedStarterIndexerContract
            ._registerUserParticipation(projectId, userAddress))
            .to.not.be.reverted;

        const afterUserTotalParticipatedProjects: BigNumber = await environment.greedStarterIndexerContract
            ._userTotalParticipatedProjects(userAddress);

        expect(userTotalParticipatedProjects.add(1)).to.be.equal(afterUserTotalParticipatedProjects);

        expect(await environment.greedStarterIndexerContract
            ._userParticipatedInProject(userAddress, projectId))
            .to.be.true;

        expect(await environment.greedStarterIndexerContract
            ._userParticipatedProjects(userAddress, afterUserTotalParticipatedProjects))
            .to.be.equal(projectId);
    });

    it('Should register the user participation only once', async () => {
        const userTotalParticipatedProjects: BigNumber = await environment.greedStarterIndexerContract
            ._userTotalParticipatedProjects(userAddress);

        await expect(environment.greedStarterIndexerContract
            ._registerUserParticipation(projectId, userAddress))
            .to.not.be.reverted;

        const afterUserTotalParticipatedProjects: BigNumber = await environment.greedStarterIndexerContract
            ._userTotalParticipatedProjects(userAddress);

        expect(userTotalParticipatedProjects).to.be.equal(afterUserTotalParticipatedProjects);
    });

}