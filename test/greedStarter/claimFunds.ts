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

    // it('should already be initialized', async() => {
    //
    // });
});