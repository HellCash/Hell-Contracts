import {deployHell} from "../../scripts/deployments/deployHell";
import {Contract} from "ethers";
import {ethers} from "hardhat";
import {deployDoublon} from "../../scripts/deployments/deployDoublon";
import {deployFUSD} from "../../scripts/deployments/deployFUSD";
import {deployBDoublon} from "../../scripts/deployments/deployBDoublon";
import {deployGreedStarter} from "../../scripts/deployments/deployGreedStarter";
import {deployGreedStarterIndexer} from "../../scripts/deployments/deployGreedStarterIndexer";

export class greedStarterTestingEnvironment {
    readonly PRINT_DEPLOYMENT_LOGS = false;
    // Environment Variables
    minimumProjectLength: number;
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
    doublonContract: Contract;
    fusdContract: Contract;
    greedStarterContract: Contract;
    greedStarterIndexerContract: Contract;
    bDoublonContract: Contract;
    // Initialize this testing environment
    async initialize(minimumProjectLength: number = 100, treasuryFees: number = 800) {
        // Set Environment Variables
        this.minimumProjectLength = minimumProjectLength;
        this.treasuryFees = treasuryFees;
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', this.PRINT_DEPLOYMENT_LOGS);;
        this.greedStarterContract = await deployGreedStarter(minimumProjectLength, this.treasurySigner.address, treasuryFees, this.PRINT_DEPLOYMENT_LOGS);
        this.greedStarterIndexerContract = await deployGreedStarterIndexer(this.greedStarterContract.address, this.PRINT_DEPLOYMENT_LOGS);
        await this.hellContract._setExcludedFromBurnList(this.greedStarterContract.address, true);
        await this.greedStarterContract._setIndexer(this.greedStarterIndexerContract.address);
        this.doublonContract = await deployDoublon(this.PRINT_DEPLOYMENT_LOGS);
        this.fusdContract = await deployFUSD(this.PRINT_DEPLOYMENT_LOGS);
        this.bDoublonContract = await deployBDoublon(this.PRINT_DEPLOYMENT_LOGS);
    };
}