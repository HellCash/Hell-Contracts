import {expect} from "chai";
import {EtherUtils} from "../../utils/ether-utils";
import {hellGovernmentTestingEnvironment} from "./@hellGovernmentTestingEnvironment";
import {BigNumber} from "ethers";

export function _setAuctionHouseTreasuryFees() {
    let environment: hellGovernmentTestingEnvironment = new hellGovernmentTestingEnvironment();

    before(async () => {
        await environment.initialize();
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellGovernmentContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._setAuctionHouseTreasuryFees(BigNumber.from(400)))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should update Hell\'s Auction House treasury fees', async() => {
        await expect(environment.hellGovernmentContract
            ._setAuctionHouseTreasuryFees(BigNumber.from(400)))
            .to.emit(environment.hellGovernmentContract, 'AuctionHouseTreasuryFeesUpdated')
            .withArgs(BigNumber.from(400));
    });

}