import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployHellGovernment} from "../../scripts/deployments/deployHellGovernment";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {deployHellVault} from "../../scripts/deployments/deployHellVault";
import {deployHell} from "../../scripts/deployments/deployHell";

export class HellVaultTestingEnvironment {
    // Account signers
    accountSigners: any[];
    masterSigner: any;
    treasurySigner: any;
    guest1Signer: any;
    guest2Signer: any;
    guest3Signer: any;
    // Proxy Contracts
    hellContract: Contract;
    hellGovernmentContract: Contract;
    hellVaultContract: Contract;
    // Initialize this testing environment
    async initialize() {
        // Set Signers
        this.accountSigners = await ethers.getSigners();
        this.masterSigner = this.accountSigners[0];
        this.treasurySigner = this.accountSigners[1];
        this.guest1Signer = this.accountSigners[2];
        this.guest2Signer = this.accountSigners[3];
        this.guest3Signer = this.accountSigners[4];
        // Set Contracts
        this.hellContract = await deployHell('Hell', 'HELL', testingEnvironmentDeploymentOptions);
        this.hellGovernmentContract = await deployHellGovernment({
            treasuryAddress: this.treasurySigner.address,
            auctionHouseFee: 800, // 0.125%
            greedStarterFee: 100, // 1%
            minimumAuctionLength: BigNumber.from(100),
            maximumAuctionLength: BigNumber.from(4000000),
            minimumProjectLength: BigNumber.from(1000),
            maximumProjectLength: BigNumber.from(16000000),
            hellVaultTreasuryFee: 16, // 6.25%
        }, testingEnvironmentDeploymentOptions);
        this.hellVaultContract = await deployHellVault(this.hellContract.address, this.hellGovernmentContract.address);
    };
}