import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {ClaimMode} from "../../enums/claimMode";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";
import {expect} from "chai";

export function updateClaimMode() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should update the user claim mode', async() => {
        const newClaimMode = ClaimMode.SendToWallet;
        await environment.hellVaultContract.connect(environment.guest1Signer).updateClaimMode(newClaimMode);
        const userInfoAfter: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(environment.guest1Signer.address);
        expect(userInfoAfter.claimMode).to.be.equal(newClaimMode);
    });
}
