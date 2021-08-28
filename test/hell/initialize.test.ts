import {expect} from "chai";
import {hellTestingEnvironment} from "./@hellTestingEnvironment";

export function initialize() {
    let environment: hellTestingEnvironment = new hellTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('should already be initialized', async() => {
        await expect(environment.hellContract.connect(environment.guest1Signer).initialize('Hell', 'HELL')).to.be
            .revertedWith("Initializable: contract is already initialized");
    });
}