import {expect} from "chai";
import {BigNumber, Contract} from "ethers";
import {ContractUtils} from "../../utils/contract-utils";
import hellSol from "../../artifacts/contracts/Hell.sol/Hell.json";
import {deployHell} from "../../scripts/deployments/deployHell";
import {deployAuctionHouse} from "../../scripts/deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "../../scripts/deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "../../scripts/deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "../../scripts/deployments/deployGreedStarterIndexer";
import {EtherUtils} from "../../utils/ether-utils";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import greedStarterSol from "../../artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import greedStarterIndexerSol from "../../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";

// Tests against UUPS proxies with non initialized contract implementations
// https://forum.openzeppelin.com/t/security-advisory-initialize-uups-implementation-contracts/15301

export function initializedImplementations() {
    it('[Hell Implementation Contract] should be already initialized', async() => {
        const hellProxy: Contract = await deployHell('Hell', 'HELL', false);
        const hellImpl: Contract = await ContractUtils.getProxyImplementationContract(hellSol, hellProxy);
        await expect(hellImpl.initialize('Himp', 'HIMP')).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Implementation Contract] should be already initialized', async() => {
        const auctionHouseProxy: Contract = await deployAuctionHouse(EtherUtils.zeroAddress(), 100, 50000, 800, false);
        const auctionHouseImpl: Contract = await ContractUtils.getProxyImplementationContract(auctionHouseSol, auctionHouseProxy);
        await expect(auctionHouseImpl.initialize(BigNumber.from(100), BigNumber.from(4000000), EtherUtils.zeroAddress(), 600)).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Indexer Implementation Contract] should be already initialized', async() => {
        const auctionHouseIndexerProxy: Contract = await deployAuctionHouseIndexer(EtherUtils.zeroAddress(), false);
        const auctionHouseIndexerImpl: Contract = await ContractUtils.getProxyImplementationContract(auctionHouseIndexerSol, auctionHouseIndexerProxy);
        await expect(auctionHouseIndexerImpl.initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Implementation Contract] should be already initialized', async() => {
        const greedStarterProxy: Contract = await deployGreedStarter(100, EtherUtils.zeroAddress(), 500, false);
        const greedStarterImpl: Contract = await ContractUtils.getProxyImplementationContract(greedStarterSol, greedStarterProxy);
        await expect(greedStarterImpl.initialize(BigNumber.from(100), EtherUtils.zeroAddress(), 500))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Indexer Implementation Contract] should be already initialized', async() => {
        const greedStarterIndexerProxy: Contract = await deployGreedStarterIndexer(EtherUtils.zeroAddress(), false);
        const greedStarterIndexerImpl: Contract = await ContractUtils.getProxyImplementationContract(greedStarterIndexerSol, greedStarterIndexerProxy);
        await expect(greedStarterIndexerImpl.initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

}