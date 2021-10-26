import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";

export function upgradeTo() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultBonusContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}