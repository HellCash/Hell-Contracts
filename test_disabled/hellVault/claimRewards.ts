import {ethers} from "hardhat";
import {Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";

describe('[Hell Vault] function claimRewards', async () => {
    it('should fail if the user attempts to withdraw more funds than what it has available', async () => {
        throw "Not Implemented";
    });

    it('should fail if no blocks have passed since the deposit ', async () => {
        // At least one block should have passed since the user deposit
        throw "Not Implemented";
    });

    it('should claim rewards and send them to the vault', function () {
        throw "Not Implemented";
    });

    it('should claim rewards and send them to the wallet', function () {
        throw "Not Implemented";
    });


});