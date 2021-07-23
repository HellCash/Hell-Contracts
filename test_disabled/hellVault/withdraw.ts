import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";

describe('[Hell Vault] function withdraw', async () => {
    it('should fail if the user attempts to withdraw more funds than what it has available', async () => {
        throw "Not Implemented";
    });

    it('should withdraw user funds successfully', async () => {
        // Verify that timestamps and distributedDividendsSinceLastPayment have been reset correctly.
        // Verify that user funds decreased from the vault
        // emit Withdraw(msg.sender, amount, rewards, treasuryFee);
        throw "Not Implemented";
    });

    it('should send user rewards to his wallet after a successful withdraw', async () => {
        throw "Not Implemented";
    });
});