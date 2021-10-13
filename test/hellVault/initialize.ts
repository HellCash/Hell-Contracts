import {expect} from "chai";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";

export function initialize() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.hellVaultContract.connect(environment.guest1Signer)
            .initialize(
                environment.hellContract.address,
                environment.hellGovernmentContract.address,
            ))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}