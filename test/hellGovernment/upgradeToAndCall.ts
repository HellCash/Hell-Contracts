import {expect} from "chai";
import {EtherUtils, zeroBytes32} from "../../utils/ether-utils";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function upgradeToAndCall() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}