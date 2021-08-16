import {expect} from "chai";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";

export function _setIndexer() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setIndexer(environment.guest1Signer.address))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the indexer', async () => {
        await expect(environment.greedStarterContract._setIndexer(environment.greedStarterIndexerContract.address))
            .to.emit(environment.greedStarterContract, "GreedStarterIndexerUpdated")
            .withArgs(environment.greedStarterIndexerContract.address);
    });
}