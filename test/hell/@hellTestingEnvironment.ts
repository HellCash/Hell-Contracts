import {BigNumber, Contract} from "ethers";
import {ethers} from "hardhat";
import {deployHell} from "../../scripts/deployments/deployHell";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {parseEther} from "ethers/lib/utils";

export class hellTestingEnvironment {
    // Account signers
    accountSigners: any[];
    masterSigner: any;
    treasurySigner: any;
    guest1Signer: any;
    guest2Signer: any;
    guest3Signer: any;
    // Proxy Contracts
    hellContract: Contract;
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
        this.hellContract = await deployHell('Hell', 'HELL', BigNumber.from("566"), testingEnvironmentDeploymentOptions);
    };
}