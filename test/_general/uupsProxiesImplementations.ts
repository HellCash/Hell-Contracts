import {expect} from "chai";
import {BigNumber, Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import {ContractUtils} from "../../utils/contract-utils";
import hellSol from "../../artifacts/contracts/Hell.sol/Hell.json";
import {deployHell} from "../../scripts/deployments/deployHell";
import {deployAuctionHouse} from "../../scripts/deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "../../scripts/deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "../../scripts/deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "../../scripts/deployments/deployGreedStarterIndexer";
import {EtherUtils, zeroBytes32} from "../../utils/ether-utils";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import greedStarterSol from "../../artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import greedStarterIndexerSol from "../../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";
import {Provider} from "@ethersproject/providers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signers";

/**

 Tests against UUPS proxies with non initialized contract implementations
 and that their upgradeTo and upgradeToAndCall methods cannot be called
 by no one but the owner
 https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301
 https://github.com/OpenZeppelin/openzeppelin-contracts/security/advisories/GHSA-5vp3-v4hc-gx76

**/

export function uupsProxiesImplementations() {
    let hellProxy: Contract;
    let hellImpl: Contract;
    let auctionHouseProxy: Contract;
    let auctionHouseImpl: Contract;
    let auctionHouseIndexerProxy: Contract;
    let auctionHouseIndexerImpl: Contract;
    let greedStarterProxy: Contract;
    let greedStarterImpl: Contract;
    let greedStarterIndexerProxy: Contract;
    let greedStarterIndexerImpl: Contract;
    let guestSigner: string | Signer | Provider | SignerWithAddress;

    before(async() => {
        guestSigner = (await ethers.getSigners())[10];
        hellProxy = await deployHell('Hell', 'HELL', false);
        hellImpl = await ContractUtils.getProxyImplementationContract(hellSol, hellProxy);
        auctionHouseProxy = await deployAuctionHouse(EtherUtils.zeroAddress(), 100, 50000, 800, false);
        auctionHouseImpl = await ContractUtils.getProxyImplementationContract(auctionHouseSol, auctionHouseProxy);
        auctionHouseIndexerProxy= await deployAuctionHouseIndexer(EtherUtils.zeroAddress(), false);
        auctionHouseIndexerImpl = await ContractUtils.getProxyImplementationContract(auctionHouseIndexerSol, auctionHouseIndexerProxy);
        greedStarterProxy = await deployGreedStarter(100, EtherUtils.zeroAddress(), 500, false);
        greedStarterImpl = await ContractUtils.getProxyImplementationContract(greedStarterSol, greedStarterProxy);
        greedStarterIndexerProxy = await deployGreedStarterIndexer(EtherUtils.zeroAddress(), false);
        greedStarterIndexerImpl = await ContractUtils.getProxyImplementationContract(greedStarterIndexerSol, greedStarterIndexerProxy);
    });

    it('[Hell Implementation Contract] Should be already initialized', async() => {
        await expect(hellImpl.initialize('Himp', 'HIMP')).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Hell Implementation Contract] upgradeTo Should fail if not called by the owner', async() => {
        await expect(hellImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Hell Implementation Contract] upgradeToAndCall Should fail if not called by the owner', async() => {
        await expect(hellImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Auction House Implementation Contract] should be already initialized', async() => {
        await expect(auctionHouseImpl.initialize(BigNumber.from(100), BigNumber.from(4000000), EtherUtils.zeroAddress(), 600)).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Implementation Contract] upgradeTo Should fail if not called by the owner', async() => {
        await expect(auctionHouseImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Auction House Implementation Contract] upgradeToAndCall Should fail if not called by the owner', async() => {
        await expect(auctionHouseImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Auction House Indexer Implementation Contract] should be already initialized', async() => {
        await expect(auctionHouseIndexerImpl.initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Indexer Implementation Contract] upgradeTo Should fail if not called by the owner', async() => {
        await expect(auctionHouseIndexerImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Auction House Indexer Implementation Contract] upgradeToAndCall Should fail if not called by the owner', async() => {
        await expect(auctionHouseIndexerImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Greed Starter Implementation Contract] should be already initialized', async() => {
        await expect(greedStarterImpl.initialize(BigNumber.from(100), EtherUtils.zeroAddress(), 500))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Implementation Contract] upgradeTo Should fail if not called by the owner', async() => {
        await expect(greedStarterImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Greed Starter Implementation Contract] upgradeToAndCall Should fail if not called by the owner', async() => {
        await expect(greedStarterImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Greed Starter Indexer Implementation Contract] should be already initialized', async() => {
        await expect(greedStarterIndexerImpl.initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Indexer Implementation Contract] upgradeTo Should fail if not called by the owner', async() => {
        await expect(greedStarterIndexerImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[Greed Starter Indexer Implementation Contract] upgradeToAndCall Should fail if not called by the owner', async() => {
        await expect(greedStarterIndexerImpl
            .connect(guestSigner) // <----- REVERT
            .upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

}