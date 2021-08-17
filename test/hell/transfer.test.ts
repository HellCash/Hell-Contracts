import {expect} from "chai";
import {BigNumber} from "ethers";
import {EtherUtils} from "../../utils/ether-utils";
import {parseEther} from "ethers/lib/utils";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function transfer()  {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if the recipient is the zero address', async () => {
        await expect(environment.hellContract.transfer(EtherUtils.zeroAddress(), parseEther("2")))
            .to.be.revertedWith("Cannot transfer to the zero address");
    });

    it("Should fail if sender doesn't have enough balance", async () => {
        await expect(environment.hellContract.connect(environment.guest1Signer).transfer(environment.guest2Signer.address, parseEther("10")))
            .to.be.revertedWith("Not enough balance");
    });

    it('Should burn fees and execute the transfer', async () => {
        const amount = parseEther("10");
        // Give some hell to guest1, since the master signer is excluded from burn fees, the full amount will arrive
        await environment.hellContract.transfer(environment.guest1Signer.address, amount);
        // Calculate the expected burn fees for a transfer between guest1 and guest2
        const expectedBurntFees = await environment.hellContract.connect(environment.guest1Signer)
            .calculateBurnFees(environment.guest1Signer.address, environment.guest2Signer.address, amount);
        const amountReceived = amount.sub(expectedBurntFees);
        const guest2Balance: BigNumber = await environment.hellContract.balanceOf(environment.guest2Signer.address);
        // Execute the transfer
        await environment.hellContract.connect(environment.guest1Signer)
            .transfer(environment.guest2Signer.address, parseEther("10"));

        await expect(guest2Balance.add(amountReceived))
            .to.be.equal(await environment.hellContract.balanceOf(environment.guest2Signer.address));
    });
}