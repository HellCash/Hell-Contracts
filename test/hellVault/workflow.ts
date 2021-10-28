import {HellVaultTestingEnvironment} from "./@hellVaultTestingEnvironment";
import {BigNumber} from "ethers";
import {formatEther, parseEther} from "ethers/lib/utils";
import {Random} from "../../utils/random";
import {NetworkUtils} from "../../utils/networkUtils";
import {HellVaultUserInfo} from "../../models/hellVaultUserInfo";

export function workflow() {
    let environment: HellVaultTestingEnvironment = new HellVaultTestingEnvironment();
    let availableSigners: any[];
    let availableBalance: BigNumber;
    let depositsInfo: {
        amount: BigNumber,
        signer: any
    }[] = [];
    before(async () => {
        await environment.initialize();
        availableSigners = environment.accountSigners;
        // Remove the master signer and the treasury address from the list of available signers
        availableSigners.splice(0, 2);
        availableBalance = await environment.hellContract.balanceOf(environment.masterSigner.address);
        // We'll remove the Master signer from being excluded from burn fees
        await environment.hellContract._setExcludedFromBurnList(environment.masterSigner.address, false);
    });

    it('Should perform random deposits on intervals of 2 to 30 blocks', async() => {
        let amountToTransferToSigner: BigNumber = parseEther(Random.randomNumber(0.01, 3).toFixed(6));
        // While the master signer has enough balance available
        while (availableBalance.gte(amountToTransferToSigner)) {
            // Pick a random signer
            const signer = availableSigners[Random.randomIntegerNumber(0, availableSigners.length - 1)];
            // Send balance from the master signer to our randomly picked signer
            await environment.hellContract.transfer(signer.address, amountToTransferToSigner);
            // Subtract registered master signer balances
            availableBalance = availableBalance.sub(amountToTransferToSigner);
            // Obtain the signer's balance
            const amountToDeposit = await environment.hellContract.balanceOf(signer.address);
            // Mine a random amount of blocks between 0 and 28
            await NetworkUtils.mineBlocks(Random.randomIntegerNumber(0, 28));
            // Increase signer's allowance with the Hell Vault
            await environment.hellContract.connect(signer)
                .approve(environment.hellVaultContract.address, amountToDeposit);
            // Perform deposit
            await environment.expectDeposit(amountToDeposit, signer);
            await environment.logVaultAndUserInfo(signer);
            if (depositsInfo[signer.address] != null) {
                depositsInfo[signer.address].amount = depositsInfo[signer.address].amount.add(amountToDeposit);
            } else {
                depositsInfo[signer.address] = {
                    amount: amountToDeposit,
                    signer: signer
                };
            }
            // Pick a random amount to share with the next signer
            amountToTransferToSigner = parseEther(Random.randomNumber(0.01, 3).toFixed(6));
        }
    });

    it('Should withdraw every deposit and his corresponding rewards', async () => {
        for (let depositInfo of depositsInfo) {
            // Mine a random amount of blocks between 0 and 28
            await NetworkUtils.mineBlocks(Random.randomIntegerNumber(0, 28));
            const beforeUserInfo: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(depositInfo.signer.address);
            console.log(`\t[Before withdraw: ${formatEther(beforeUserInfo.hellDeposited)} (${beforeUserInfo.hellDeposited} wei)]`);
            await environment.logVaultAndUserInfo(depositInfo.signer);
            await environment.expectWithdraw(beforeUserInfo.hellDeposited, depositInfo.signer);
            const afterUserInfo: HellVaultUserInfo = await environment.hellVaultContract.getUserInfo(depositInfo.signer.address);
            console.log(`\t[After withdraw: ${formatEther(afterUserInfo.hellDeposited)} (${afterUserInfo.hellDeposited} wei)]`);
            await environment.logVaultAndUserInfo(depositInfo.signer);
        }
    });
}