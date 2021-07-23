import {expect} from "chai";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {commify, formatEther, parseEther} from "ethers/lib/utils";

describe('[Hell] function calculateBurnFees', async () => {
    let guest1Signer: any;
    let guest2Signer: any;
    let hellContract: Contract;
    const registeredFees: {amount: BigNumber, fee: BigNumber}[] = [];
    before(async() => {
        const accountSigners = await ethers.getSigners();
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
        hellContract = await HellTestHelpers.getHellContract(guest1Signer);
    });

    it(`Should calculate the right amount of fees`, async () => {
        const currentBurnFee: BigNumber = await hellContract._burnFee();
        let testedAmount = parseEther("10");
        for (let i = 0; i < 18; i++) {
            const expectedBurnedFees = currentBurnFee.mul(testedAmount.div(100));
            const burnedFees = await hellContract.calculateBurnFees(testedAmount, guest2Signer.address);
            expect(expectedBurnedFees).to.be.equal(burnedFees);
            registeredFees.push({amount: testedAmount, fee: burnedFees});
            testedAmount = testedAmount.div("10");
        }
    });

    after(() => {
        console.log('\tRegistered fees');
        registeredFees.forEach(registeredFee => {
            console.log(`\t\tamount: ${commify(formatEther(registeredFee.amount))} fee: ${commify(formatEther(registeredFee.fee))}`);
        });
    });
});