import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {EtherUtils} from "../../utils/etherUtils";

export function _setHellGovernmentContract() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update the Hell Government Contract', async() => {
        await expect(environment.auctionHouseContract
            ._setHellGovernmentContract(EtherUtils.zeroAddress()))
            .to.emit(environment.auctionHouseContract, 'HellGovernmentContractUpdated')
            .withArgs(EtherUtils.zeroAddress());
    });
}