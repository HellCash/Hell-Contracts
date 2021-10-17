import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";

export function upgradeTo() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}