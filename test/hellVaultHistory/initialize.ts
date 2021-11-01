import {expect} from "chai";
import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";

export function initialize() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.hellVaultHistoryContract.connect(environment.guest1Signer)
            .initialize(environment.hellVaultContract.address, environment.hellGovernmentContract.address))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}