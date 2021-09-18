import {expect} from "chai";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";
import {BigNumber} from "ethers";

export function _setMinimumAndMaximumAuctionLength() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setMinimumAndMaximumAuctionLength(BigNumber.from(5000), BigNumber.from(4000000)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the minimum and maximum auction lengths', async() => {
        await expect(environment.hellGovernmentContract
            ._setMinimumAndMaximumAuctionLength(BigNumber.from(5000), BigNumber.from(4000000)))
            .to.emit(environment.hellGovernmentContract, 'MinimumAndMaximumAuctionLengthUpdated')
            .withArgs(BigNumber.from(5000), BigNumber.from(4000000));
    });

}