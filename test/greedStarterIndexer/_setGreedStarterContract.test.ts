import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {expect} from "chai";

export function _setGreedStarterContract() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.greedStarterIndexerContract.connect(environment.guest1Signer)
            ._setGreedStarterContract(environment.guest1Signer.address))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Greed Starter contract address', async() => {
        const currentGreedStarterAddress = await environment.greedStarterIndexerContract._greedStarterAddress();
        const newGreedStarterAddress = environment.masterSigner.address;
        expect(currentGreedStarterAddress).to.not.be.equal(newGreedStarterAddress);

        await expect(environment.greedStarterIndexerContract
            ._setGreedStarterContract(environment.masterSigner.address))
            .to.emit(environment.greedStarterIndexerContract, "GreedStarterContractUpdated")
            .withArgs(newGreedStarterAddress);

        expect( await environment.greedStarterIndexerContract._greedStarterAddress()).to.be.equal(newGreedStarterAddress);
    });
}