import {expect} from "chai";
import {BigNumber, Contract} from "ethers";
import {EtherUtils} from "../../utils/ether-utils";
import {parseEther} from "ethers/lib/utils";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function transferFrom() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if the recipient is the zero address', async () => {
        await expect(environment.hellContract.transferFrom(environment.guest1Signer.address, EtherUtils.zeroAddress(), parseEther("2")))
            .to.be.revertedWith("Cannot transfer to the zero address");
    });

    it("Should fail if sender doesn't have enough balance", async () => {
        await expect(environment.hellContract.transferFrom(
            environment.guest1Signer.address,
            environment.masterSigner.address,
            parseEther("200")
        )).to.be.revertedWith("Not enough balance");
    });

    it('Should burn fees and execute the transfer', async () => {
        const amount = parseEther("10");
        // Give some hell to guest1, since the master signer is excluded from burn fees, the full amount will arrive
        await environment.hellContract.transfer(environment.guest1Signer.address, amount);
        const guest1HellContract: Contract = await environment.hellContract.connect(environment.guest1Signer);
        // Increase master signer allowance
        await guest1HellContract.approve(environment.masterSigner.address, amount);
        // Calculate the expected burn fees for a transfer between guest1 and guest2
        const expectedBurntFees = await guest1HellContract.calculateBurnFees(environment.guest1Signer.address, environment.guest2Signer.address, amount);
        const amountReceived = amount.sub(expectedBurntFees);

        const guest2Balance: BigNumber = await environment.hellContract.balanceOf(environment.guest2Signer.address);
        // Execute the transferFrom
        await environment.hellContract.transferFrom(environment.guest1Signer.address, environment.guest2Signer.address, amount);
        const guest2AfterBalance: BigNumber = await environment.hellContract.balanceOf(environment.guest2Signer.address);
        expect(guest2Balance.add(amountReceived)).to.be.equal(guest2AfterBalance);
    });
}