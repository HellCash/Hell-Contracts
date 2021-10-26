import {expect} from "chai";
import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";

export function initialize() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.hellVaultBonusContract.connect(environment.guest1Signer)
            .initialize(environment.hellVaultContract.address))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}