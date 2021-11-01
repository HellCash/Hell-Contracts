import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";

export function upgradeTo() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultHistoryContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}