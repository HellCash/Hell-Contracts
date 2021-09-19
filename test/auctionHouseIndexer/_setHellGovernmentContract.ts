import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";

export function _setHellGovernmentContract() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseIndexerContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Government Contract', async() => {
        await expect(environment.auctionHouseIndexerContract
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.emit(environment.auctionHouseIndexerContract, 'HellGovernmentContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}