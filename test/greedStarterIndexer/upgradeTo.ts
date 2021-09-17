import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";

export function upgradeTo() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}