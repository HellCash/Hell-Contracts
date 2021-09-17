import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {EtherUtils, zeroBytes32} from "../../utils/ether-utils";

export function upgradeToAndCall() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.auctionHouseContract
            .connect(environment.guest1Signer) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
}