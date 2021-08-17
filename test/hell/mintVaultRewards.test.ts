import {BigNumber} from "ethers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function mintVaultRewards() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it("Should fail if msg.sender isn't the Hell Vault", async () => {
        await expect(environment.hellContract
            .connect(environment.guest1Signer)
            .mintVaultRewards(parseEther('100')))
            .to.be.revertedWith('Only the Hell Vault might trigger this function');
    });

    it('Should mint vault rewards', async function () {
        const mintedAmount = parseEther('5');
        const hellVaultAddress = await environment.hellContract._hellVaultAddress();
        const hellVaultBalance: BigNumber = await environment.hellContract.balanceOf(hellVaultAddress);
        await expect(environment.hellContract.mintVaultRewards(mintedAmount))
            .to.emit(environment.hellContract, "HellVaultMint")
            .withArgs(mintedAmount);
        expect(hellVaultBalance.add(mintedAmount)).to.be.equal(await environment.hellContract.balanceOf(hellVaultAddress));
    });

}