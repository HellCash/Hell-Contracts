import {expect} from "chai";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";
import {BigNumber} from "ethers";

export function _setMinimumAndMaximumProjectLength() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setMinimumAndMaximumProjectLength(BigNumber.from(2000), BigNumber.from(90000000)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the minimum and maximum project lengths', async() => {
        await expect(environment.hellGovernmentContract
            ._setMinimumAndMaximumProjectLength(BigNumber.from(2000), BigNumber.from(90000000)))
            .to.emit(environment.hellGovernmentContract, 'MinimumAndMaximumProjectLengthUpdated')
            .withArgs(BigNumber.from(2000), BigNumber.from(90000000));
    });

}