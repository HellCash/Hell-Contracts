import {expect} from "chai";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {EtherUtils} from "../../utils/ether-utils";
import {parseEther} from "ethers/lib/utils";

describe('[Hell] function transfer', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];

        const hellContract: Contract = await HellTestHelpers.getHellContract(guest1Signer);
        await hellContract.approve(masterSigner.address, parseEther("300"));
    });

    it('Should fail if the recipient is the zero address', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract.transferFrom(guest1Signer.address, EtherUtils.zeroAddress(), parseEther("2")))
            .to.be.revertedWith("Cannot transfer to the zero address");
    });

    it('"Should fail if sender doesn\'t have enough balance"', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await expect(hellContract.transferFrom(guest1Signer.address, masterSigner.address, parseEther("200")))
            .to.be.revertedWith("Not enough balance");
    });

    it('Should burn fees and execute the transfer', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        const amount = parseEther("10");
        // Give some hell to guest1
        await hellContract.transfer(guest1Signer.address, amount);
        const burnedFees = await hellContract.calculateBurnFees(amount, guest2Signer.address);
        const amountReceived = amount.sub(burnedFees);
        const guest2Balance: BigNumber = await hellContract.balanceOf(guest2Signer.address);
        // Now proceed to send some hell from guest1 to guest2
        await hellContract.transferFrom(guest1Signer.address, guest2Signer.address, parseEther("10"));

        await expect(guest2Balance.add(amountReceived)).to.be.equal(await hellContract.balanceOf(guest2Signer.address));
    });
});