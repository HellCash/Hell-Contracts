import {expect} from "chai";
import {BigNumber} from "ethers";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";

export function initialize() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('should already be initialized', async() => {
        await expect(environment.hellGovernmentContract.connect(environment.guest1Signer)
            .initialize(
                environment.treasurySigner.address,
                1,
                BigNumber.from(1),
                BigNumber.from(1),
                1,
                BigNumber.from(1),
                BigNumber.from(1),
                BigNumber.from(1),
                BigNumber.from(1),
            ))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}