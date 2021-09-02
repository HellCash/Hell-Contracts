import {expect} from "chai";
import {auctionHouseTestingEnvironment} from "./@auctionHouseTestingEnvironment";
import {BigNumber} from "ethers";

export function initialize() {
    let environment: auctionHouseTestingEnvironment = new auctionHouseTestingEnvironment();
    before(async () => {
        await environment.initialize();
    });

    it('Should already be initialized', async() => {
        await expect(environment.auctionHouseContract.connect(environment.guest1Signer)
            .initialize(BigNumber.from(100), BigNumber.from(4000000), environment.guest1Signer.address, 600))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });
}