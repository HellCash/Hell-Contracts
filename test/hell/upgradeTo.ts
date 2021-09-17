import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function upgradeTo() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}