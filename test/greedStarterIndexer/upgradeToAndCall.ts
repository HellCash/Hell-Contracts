import {expect} from "chai";
import {EtherUtils, zeroBytes32} from "../../utils/ether-utils";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";

export function upgradeToAndCall() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}