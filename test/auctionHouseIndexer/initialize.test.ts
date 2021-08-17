import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "../auctionHouse/@auctionHouseTestingEnvironment";

export function initialize() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.auctionHouseIndexerContract.connect(environment.guest1Signer)
            .initialize(environment.guest1Signer.address)).to.be.revertedWith("Initializable: contract is already initialized");
    });
}