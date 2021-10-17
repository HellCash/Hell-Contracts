import {expect} from "chai";
import {EtherUtils, zeroBytes32} from "../../utils/etherUtils";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";

export function upgradeToAndCall() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}