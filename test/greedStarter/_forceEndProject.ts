import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {expect} from "chai";

export function _forceEndProject() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    let projectId: BigNumber;
    before(async () => {
        await environment.initialize();
        const currentBlock = await ethers.provider.getBlockNumber();
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("100"));
        await environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            parseEther("60"), // Total Tokens
            currentBlock + 5, // Starting block
            currentBlock + environment.minimumProjectLength + 50, // Ending block
            parseUnits("16500",6), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );
        projectId = totalProjects.add(1);
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._forceEndProject(projectId))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should forcefully end the project', async() => {
        await expect(environment.greedStarterContract._forceEndProject(projectId)).to
            .emit(environment.greedStarterContract, "ProjectClosedByAdmin")
            .withArgs(projectId);
    });

    it('Should fail if the project already ended', async() => {
        await expect(environment.greedStarterContract._forceEndProject(projectId)).to
            .be.revertedWith("FE")
    });
}