import {expect} from "chai";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {BigNumber} from "ethers";

export function initialize() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('should already be initialized', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer)
            .initialize(BigNumber.from(100), environment.guest1Signer.address, 500))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}