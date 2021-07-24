import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";

describe('[Greed Starter] function claimFunds', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
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

    it('Should fail if trying to claim funds without having invested', async() => {
        // Expect Revert WR3
        throw "Not implemented";
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