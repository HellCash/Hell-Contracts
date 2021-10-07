import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";

export function upgradeTo() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}