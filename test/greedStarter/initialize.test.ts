import {expect} from "chai";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {EtherUtils} from "../../utils/etherUtils";

export function initialize() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('should already be initialized', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer)
            .initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}