import {deployHell} from "../../scripts/deployments/deployHell";
import {deployAuctionHouse} from "../../scripts/deployments/deployAuctionHouse";
import {deployAuctionHouseIndexer} from "../../scripts/deployments/deployAuctionHouseIndexer";
import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployDoublon} from "../../scripts/deployments/deployDoublon";
import {deployFUSD} from "../../scripts/deployments/deployFUSD";
import {deployBDoublon} from "../../scripts/deployments/deployBDoublon";

export class auctionHouseTestingEnvironment {
    readonly PRINT_DEPLOYMENT_LOGS = false;
    // Environment Variables
    minimumAuctionLength: number;
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
    auctionHouseContract: Contract;
    auctionHouseIndexerContract: Contract;
    bDoublonContract: Contract;
    // Initialize this testing environment
    async initialize(minimumAuctionLength: number = 100, treasuryFees: number = 800) {
        // Set Environment Variables
        this.minimumAuctionLength = minimumAuctionLength;
        this.treasuryFees = treasuryFees;
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell(this.PRINT_DEPLOYMENT_LOGS);
        this.auctionHouseContract = await deployAuctionHouse(this.treasurySigner.address, BigNumber.from(this.minimumAuctionLength),  this.treasuryFees, this.PRINT_DEPLOYMENT_LOGS);
        this.auctionHouseIndexerContract = await deployAuctionHouseIndexer(this.auctionHouseContract.address, this.PRINT_DEPLOYMENT_LOGS);
        await this.hellContract._setExcludedFromBurnList(this.auctionHouseContract.address, true);
        await this.auctionHouseContract._setIndexer(this.auctionHouseIndexerContract.address);
        this.doublonContract = await deployDoublon(this.PRINT_DEPLOYMENT_LOGS);
        this.fusdContract = await deployFUSD(this.PRINT_DEPLOYMENT_LOGS);
        this.bDoublonContract = await deployBDoublon(this.PRINT_DEPLOYMENT_LOGS);
    };
}