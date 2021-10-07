import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";

export function _setHellGovernmentContract() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Government Contract', async() => {
        await expect(environment.greedStarterIndexerContract
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.emit(environment.greedStarterIndexerContract, 'HellGovernmentContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}