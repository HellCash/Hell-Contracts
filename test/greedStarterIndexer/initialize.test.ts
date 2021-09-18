import {expect} from "chai";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {EtherUtils} from "../../utils/ether-utils";

export function initialize() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('should already be initialized', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            .initialize(EtherUtils.zeroAddress(), environment.guest1Signer.address))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}