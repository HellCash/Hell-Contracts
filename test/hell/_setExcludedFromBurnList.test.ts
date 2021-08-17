import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function _setExcludedFromBurnList() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellContract.connect(environment.guest1Signer)
            ._setExcludedFromBurnList(environment.guest1Signer.address, true))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should fail if the excluded address is the zero address', async() => {
        await expect(environment.hellContract._setExcludedFromBurnList(EtherUtils.zeroAddress(), true))
            .to.be.revertedWith("Cannot exclude the zero address");
    });

    it('Should setExcludedFromBurnList', async() => {
        await expect(environment.hellContract._setExcludedFromBurnList(environment.treasurySigner.address, true))
            .to.emit(environment.hellContract, "ExcludedFromBurnList")
            .withArgs(environment.treasurySigner.address, true);

        expect(await environment.hellContract._excludedFromBurnFees(environment.treasurySigner.address)).to.be.equal(true);

        await expect(environment.hellContract._setExcludedFromBurnList(environment.treasurySigner.address, false))
            .to.emit(environment.hellContract, "ExcludedFromBurnList")
            .withArgs(environment.treasurySigner.address, false);

        expect(await environment.hellContract._excludedFromBurnFees(environment.treasurySigner.address)).to.be.equal(false);
    });

}