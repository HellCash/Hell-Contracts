import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";
import {EtherUtils} from "../../utils/ether-utils";

export function initialize() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.auctionHouseIndexerContract.connect(environment.guest1Signer)
            .initialize(EtherUtils.zeroAddress(), EtherUtils.zeroAddress())).to.be.revertedWith("Initializable: contract is already initialized");
    });
}