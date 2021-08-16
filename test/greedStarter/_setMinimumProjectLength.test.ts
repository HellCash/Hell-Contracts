import {expect} from "chai";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {BigNumber} from "ethers";

export function _setMinimumProjectLength() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setMinimumProjectLength(BigNumber.from(10)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the minimumProjectLength', async () => {
        await expect(environment.greedStarterContract
            ._setMinimumProjectLength(BigNumber.from(1000)))
            .to.emit(environment.greedStarterContract, "MinimumProjectLengthUpdated")
            .withArgs(BigNumber.from(1000));
    });
}