import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {EtherUtils} from "../../utils/ether-utils";
import contractAddresses from "../../scripts/contractAddresses.json";

describe('[Greed Starter] function claimFunds', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    let hellProjectId: BigNumber;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];

        const currentBlock = await ethers.provider.getBlockNumber();

        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(contractAddresses.greedStarter, parseEther("100"));

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);

        const totalProjects: BigNumber = await greedStarterContract._totalProjects();


        await greedStarterContract.createProject(
            contractAddresses.hell, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("50"), // Total Tokens
            currentBlock + 25, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("20"), // Price per token
            parseEther("1"), // Minimum Purchase
            parseEther("5") // Maximum Purchase
        );

        hellProjectId = totalProjects.add(1);
    });

    it('Should fail if the Project is still in progress', async() => {
        // Expect revert WR1
        throw "Not implemented";
    });

    it('Project creator should be able to withdraw his rewards and left over tokens', async() => {
        // Verify that treasury fees were paid if anything was sold
        // Verify that the creator received his rewards (Tokens that were sold)
        // Verify that the creator received any left over tokens (Tokens that didn't sold)
        // Expect event emission "CreatorWithdrawnFunds"
        throw "Not implemented";
    });

    it('Should fail if the creator tries to claim more than once', async() => {
        // Expect revert WR2
        throw "Not implemented";
    });



    it('Should fail if the project is finished and the user tries to claim funds without having invested', async() => {
        // To make this tests we need to wait until the project finishes.
        for (let i = 0; i < 1000; i++) {
            await ethers.provider.send('evm_mine', []);
        }
        // Expect Revert WR3
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.claimFunds(hellProjectId)).to.be.revertedWith("WR3");
    });

    it('Investors should be able to withdraw his rewards', async() => {
        // Verify that the user received his funds
        // Verify that the users rewards were set back to 0
        // Expect event emission "RewardsClaimed"
        throw "Not implemented";
    });

    it('Should fail if investor tries to withdraw his rewards more than once', async() => {
        // Expect Revert WR3
        throw "Not Implemented";
    });

});