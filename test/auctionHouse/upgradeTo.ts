import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {EtherUtils} from "../../utils/ether-utils";

export function upgradeTo() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}