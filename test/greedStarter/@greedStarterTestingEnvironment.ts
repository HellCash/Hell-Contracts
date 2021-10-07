import {deployHell} from "../../scripts/deployments/deployHell";
import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployDoublon} from "../../scripts/deployments/deployDoublon";
import {deployFUSD} from "../../scripts/deployments/deployFUSD";
import {deployBDoublon} from "../../scripts/deployments/deployBDoublon";
import {deployGreedStarter} from "../../scripts/deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "../../scripts/deployments/deployGreedStarterIndexer";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {deployHellGovernment} from "../../scripts/deployments/deployHellGovernment";

export class greedStarterTestingEnvironment {
    // Environment Variables
    minimumProjectLength: BigNumber;
    maximumProjectLength: BigNumber;
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
    greedStarterContract: Contract;
    greedStarterIndexerContract: Contract;
    bDoublonContract: Contract;
    // Initialize this testing environment
    async initialize(minimumProjectLength = BigNumber.from(100), maximumProjectLength = BigNumber.from(40000), treasuryFees: number = 100) {
        // Set Environment Variables
        this.minimumProjectLength = minimumProjectLength;
        this.maximumProjectLength = maximumProjectLength;
        this.treasuryFees = treasuryFees;
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', testingEnvironmentDeploymentOptions);
        this.hellGovernment = await deployHellGovernment({
            treasuryAddress: this.treasurySigner.address,
            auctionHouseFee: BigNumber.from(800),
            greedStarterFee: treasuryFees, // 1%
            minimumAuctionLength: BigNumber.from(5000),
            maximumAuctionLength: BigNumber.from(16000000),
            minimumProjectLength: minimumProjectLength,
            maximumProjectLength: maximumProjectLength,
        }, testingEnvironmentDeploymentOptions);
        this.greedStarterContract = await deployGreedStarter(this.hellGovernment.address, testingEnvironmentDeploymentOptions);
        this.greedStarterIndexerContract = await deployGreedStarterIndexer(this.hellGovernment.address, this.greedStarterContract.address, testingEnvironmentDeploymentOptions);
        await this.hellContract._setExcludedFromBurnList(this.greedStarterContract.address, true);
        await this.greedStarterContract._setIndexer(this.greedStarterIndexerContract.address);
        this.doublonContract = await deployDoublon(testingEnvironmentDeploymentOptions);
        this.fusdContract = await deployFUSD(testingEnvironmentDeploymentOptions);
        this.bDoublonContract = await deployBDoublon(testingEnvironmentDeploymentOptions);
    };
}