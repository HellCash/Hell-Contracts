import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {BigNumber} from "ethers";
import {expect} from "chai";
import {formatEther} from "ethers/lib/utils";
import {HellVaultPeriodIndexStatus} from "../../models/hellVaultPeriodIndexStatus";

export function getDividendPeriodIndex() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();

    it('Should detect the proper period indexes between 0 to 670', async () => {
        for (let i = 0; i < 670; i++) {
            await environment.initialize(BigNumber.from(i));
            const [status, index] = await environment.hellVaultContract.getDividendPeriodIndex();
            const totalSupply = await environment.hellContract.totalSupply();
            console.log(`\t\tSupply: ${formatEther(totalSupply)}\tStatus: ${HellVaultPeriodIndexStatus[status]}\tIndex: ${index}`);
            if (i <= 0 || i <= 666) {
                expect(status).to.be.equal(HellVaultPeriodIndexStatus.WithinRange);
            } else {
                expect(status).to.be.equal(HellVaultPeriodIndexStatus.HigherThanLastToPeriod);
            }
        }
    });

}
