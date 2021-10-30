import {deployHell} from "../../scripts/deployments/deployHell";
import {deployAuctionHouse} from "../../scripts/deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "../../scripts/deployments/deployAuctionHouseIndexer";
import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployDoublon} from "../../scripts/deployments/deployDoublon";
import {deployFUSD} from "../../scripts/deployments/deployFUSD";
import {deployBDoublon} from "../../scripts/deployments/deployBDoublon";
import {deployRandom} from "../../scripts/deployments/deployRandom";
import {parseEther} from "ethers/lib/utils";
import {deployHellGovernment} from "../../scripts/deployments/deployHellGovernment";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";

export class auctionHouseTestingEnvironment {
    // Environment Variables
    minimumAuctionLength: BigNumber;
    maximumAuctionLength: BigNumber;
    treasuryFees: number;
    // Account signers
    accountSigners: any[];
    masterSigner: any;
    treasurySigner: any;
    guest1Signer: any;
    guest2Signer: any;
    guest3Signer: any;
    // Proxy Contracts
    hellContract: Contract;
    hellGovernment: Contract;
    doublonContract: Contract;
    fusdContract: Contract;
    auctionHouseContract: Contract;
    auctionHouseIndexerContract: Contract;
    bDoublonContract: Contract;
    randomContract: Contract;
    // Initialize this testing environment
    async initialize(minimumAuctionLength = BigNumber.from(100), maximumAuctionLength = BigNumber.from(4000000), treasuryFees: number = 800, randomTokenSupply: BigNumber = parseEther('100000')) {
        // Set Environment Variables
        this.minimumAuctionLength = minimumAuctionLength;
        this.maximumAuctionLength = maximumAuctionLength;
        this.treasuryFees = treasuryFees;
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', parseEther("566"), testingEnvironmentDeploymentOptions);
        this.hellGovernment = await deployHellGovernment({
            treasuryAddress: this.treasurySigner.address,
            auctionHouseFee: treasuryFees,
            greedStarterFee: 100, // 1%
            minimumAuctionLength: minimumAuctionLength,
            maximumAuctionLength: maximumAuctionLength,
            minimumProjectLength: BigNumber.from(1000),
            maximumProjectLength: BigNumber.from(16000000),
            hellVaultTreasuryFee: 16, // 6.25%
            hellVaultCompounderFee: 5 // 20% of the Treasury fees
        }, testingEnvironmentDeploymentOptions);
        // Set HELL as a trusted token
        await this.hellGovernment._setTokenTrust(this.hellContract.address, true);
        this.auctionHouseContract = await deployAuctionHouse(this.hellGovernment.address, testingEnvironmentDeploymentOptions);
        this.auctionHouseIndexerContract = await deployAuctionHouseIndexer(this.hellGovernment.address, this.auctionHouseContract.address, testingEnvironmentDeploymentOptions);
        await this.hellContract._setExcludedFromBurnList(this.auctionHouseContract.address, true);
        await this.auctionHouseContract._setIndexer(this.auctionHouseIndexerContract.address);
        this.doublonContract = await deployDoublon(testingEnvironmentDeploymentOptions);
        this.fusdContract = await deployFUSD(testingEnvironmentDeploymentOptions);
        this.bDoublonContract = await deployBDoublon(testingEnvironmentDeploymentOptions);
        this.randomContract = await deployRandom(randomTokenSupply, testingEnvironmentDeploymentOptions);
    };
}