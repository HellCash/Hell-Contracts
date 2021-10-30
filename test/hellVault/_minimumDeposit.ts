import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {expect} from "chai";
import {parseUnits} from "ethers/lib/utils";
import {BigNumber} from "ethers";

export function _minimumDeposit() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should return 1e12', async() => {
        const minimumDeposit: BigNumber = await environment.hellVaultContract._minimumDeposit();
        expect(minimumDeposit).to.be.equal(parseUnits("1", 12));
    });
}
