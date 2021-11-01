import {expect} from "chai";
import {EtherUtils, zeroBytes32} from "../../utils/etherUtils";
import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";

export function upgradeToAndCall() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultHistoryContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}