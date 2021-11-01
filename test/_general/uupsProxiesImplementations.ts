import {expect} from "chai";
import {BigNumber, Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import {ContractUtils} from "../../utils/contractUtils";
import hellSol from "../../artifacts/contracts/Hell.sol/Hell.json";
import {deployHell} from "../../scripts/deployments/deployHell";
import {deployAuctionHouse} from "../../scripts/deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "../../scripts/deployments/deployAuctionHouseIndexer";
import {deployGreedStarter} from "../../scripts/deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "../../scripts/deployments/deployGreedStarterIndexer";
import {EtherUtils, zeroBytes32} from "../../utils/etherUtils";
import auctionHouseSol from "../../artifacts/contracts/AuctionHouse.sol/AuctionHouse.json";
import hellGovernmentSol from "../../artifacts/contracts/HellGovernment.sol/HellGovernment.json";
import auctionHouseIndexerSol from "../../artifacts/contracts/AuctionHouseIndexer.sol/AuctionHouseIndexer.json";
import greedStarterSol from "../../artifacts/contracts/GreedStarter.sol/GreedStarter.json";
import greedStarterIndexerSol from "../../artifacts/contracts/GreedStarterIndexer.sol/GreedStarterIndexer.json";
import {Provider} from "@ethersproject/providers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signers";
import {deployHellGovernment} from "../../scripts/deployments/deployHellGovernment";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {HellGovernmentInitializer} from "../../models/hellGovernmentInitializer";
import {parseEther} from "ethers/lib/utils";

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
    let hellGovernmentInitializer: HellGovernmentInitializer;
    let hellGovernmentProxy: Contract;
    let hellGovernmentImpl: Contract;
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
        const signers = await ethers.getSigners();
        const treasurySigner = signers[2];
        guestSigner = signers[10];
        hellProxy = await deployHell('Hell', 'HELL', BigNumber.from("566"), testingEnvironmentDeploymentOptions);
        hellImpl = await ContractUtils.getProxyImplementationContract(hellSol, hellProxy);
        hellGovernmentInitializer = {
            treasuryAddress: treasurySigner.address,
            auctionHouseFee: 800, // 0.125%
            greedStarterFee: 100, // 1%
            minimumAuctionLength: BigNumber.from(100),
            maximumAuctionLength: BigNumber.from(4000000),
            minimumProjectLength: BigNumber.from(1000),
            maximumProjectLength: BigNumber.from(16000000),
            hellVaultTreasuryFee: 16, // 6.25%
            hellVaultCompounderFee: 5 // 20% of the Treasury fees
        };
        hellGovernmentProxy = await deployHellGovernment(hellGovernmentInitializer, testingEnvironmentDeploymentOptions);
        hellGovernmentImpl = await ContractUtils.getProxyImplementationContract(hellGovernmentSol, hellGovernmentProxy);
        auctionHouseProxy = await deployAuctionHouse(hellGovernmentProxy.address, testingEnvironmentDeploymentOptions);
        auctionHouseImpl = await ContractUtils.getProxyImplementationContract(auctionHouseSol, auctionHouseProxy);
        auctionHouseIndexerProxy= await deployAuctionHouseIndexer(hellGovernmentProxy.address, EtherUtils.zeroAddress(), testingEnvironmentDeploymentOptions);
        auctionHouseIndexerImpl = await ContractUtils.getProxyImplementationContract(auctionHouseIndexerSol, auctionHouseIndexerProxy);
        greedStarterProxy = await deployGreedStarter(hellGovernmentProxy.address, testingEnvironmentDeploymentOptions);
        greedStarterImpl = await ContractUtils.getProxyImplementationContract(greedStarterSol, greedStarterProxy);
        greedStarterIndexerProxy = await deployGreedStarterIndexer(hellGovernmentProxy.address, EtherUtils.zeroAddress(), testingEnvironmentDeploymentOptions);
        greedStarterIndexerImpl = await ContractUtils.getProxyImplementationContract(greedStarterIndexerSol, greedStarterIndexerProxy);
    });

    it('[Hell Implementation Contract] Should be already initialized', async() => {
        await expect(hellImpl.initialize('Himp', 'HIMP')).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Hell Government Implementation Contract] Should be already initialized', async() => {
        await expect(hellGovernmentImpl.initialize(
            hellGovernmentInitializer.treasuryAddress,
            hellGovernmentInitializer.auctionHouseFee,
            hellGovernmentInitializer.minimumAuctionLength,
            hellGovernmentInitializer.maximumAuctionLength,
            hellGovernmentInitializer.greedStarterFee,
            hellGovernmentInitializer.minimumProjectLength,
            hellGovernmentInitializer.maximumProjectLength,
        )).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Implementation Contract] should be already initialized', async() => {
        await expect(auctionHouseImpl.initialize(EtherUtils.zeroAddress())).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Auction House Indexer Implementation Contract] should be already initialized', async() => {
        await expect(auctionHouseIndexerImpl.initialize(EtherUtils.zeroAddress(), EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Implementation Contract] should be already initialized', async() => {
        await expect(greedStarterImpl.initialize(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Greed Starter Indexer Implementation Contract] should be already initialized', async() => {
        await expect(greedStarterIndexerImpl.initialize(EtherUtils.zeroAddress(), EtherUtils.zeroAddress()))
            .to.be.revertedWith("Initializable: contract is already initialized");
    });

    it('[Hell Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(hellImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Hell Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(hellImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Hell Government Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(hellGovernmentImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Hell Government Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(hellGovernmentImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Auction House Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(auctionHouseImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Auction House Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(auctionHouseImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Auction House Indexer Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(auctionHouseIndexerImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Auction House Indexer Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(auctionHouseIndexerImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Greed Starter Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(greedStarterImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Greed Starter Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(greedStarterImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Greed Starter Indexer Implementation Contract] upgradeTo must be called through delegatecall', async() => {
        await expect(greedStarterIndexerImpl.upgradeTo(EtherUtils.zeroAddress()))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

    it('[Greed Starter Indexer Implementation Contract] upgradeToAndCall must be called through delegatecall', async() => {
        await expect(greedStarterIndexerImpl.upgradeToAndCall(EtherUtils.zeroAddress(), zeroBytes32))
            .to.be.revertedWith("Function must be called through delegatecall");
    });

}