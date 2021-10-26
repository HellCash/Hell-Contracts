import {expect} from "chai";
import {EtherUtils, zeroBytes32} from "../../utils/etherUtils";
import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";

export function upgradeToAndCall() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultBonusContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}