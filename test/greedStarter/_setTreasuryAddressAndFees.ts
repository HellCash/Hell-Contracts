import {ethers} from "hardhat";
import {expect} from "chai";
import {Contract} from "ethers";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";

describe('[Greed Starter] function _setTreasuryAddressAndFees', async() => {

    let masterSigner: any;
    let guest1Signer: any;
    let treasurySigner: any;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        treasurySigner = accountSigners[3];
    });

    it('Should fail if not called by the owner', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract._setTreasuryAddressAndFees(guest1Signer.address, 400)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the treasury address and his fees', async () => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        await expect(greedStarterContract._setTreasuryAddressAndFees(treasurySigner.address, 400)).to.emit(greedStarterContract, "TreasuryAddressAndFeesUpdated").withArgs(treasurySigner.address, 400);
    });
});