import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";

export function _distributeBonuses() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();
    let bonusesInfo: HellVaultBonusInfo[];

    before(async () => {
        await environment.initialize();
        // Add some testing bonuses
        bonusesInfo = await environment.createTestingBonuses();
        // We'll use the masterSigner as the HellVaultAddress
        await environment.hellVaultBonusContract._setHellVaultAddress(environment.masterSigner.address);
    });

    it('should print the bonuses info', async () => {
        console.log(bonusesInfo);
    });
}