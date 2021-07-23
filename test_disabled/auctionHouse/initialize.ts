import {AuctionTestHelpers} from "../../helpers/AuctionTestHelpers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {Contract} from "ethers";

describe('[Auction House] function initialize', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
    });
    it('should already be initialized', async() => {
        const contract: Contract = await AuctionTestHelpers.getAuctionContract(guest1Signer);
        await expect(contract.initialize()).to.be
            .revertedWith("Initializable: contract is already initialized");
    });
});