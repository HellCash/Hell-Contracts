import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";
import {NetworkUtils} from "../../utils/networkUtils";
import {BigNumber} from "ethers";
import {formatEther, parseEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import erc20Sol from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import {expect} from "chai";

export function _distributeBonuses() {
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();
    let bonusesInfo: HellVaultBonusInfo[];

    before(async () => {
        await environment.initialize();
        // Add some testing bonuses
        bonusesInfo = await environment.createTestingBonuses();
        // We'll use the masterSigner as the HellVaultAddress
        await environment.hellVaultBonusContract._setHellVaultAddress(environment.masterSigner.address);
        await NetworkUtils.mineBlocks(100);
    });

    it('[Guest1] Should receive distributed bonuses', async () => {
        const stakeToReward = parseEther('5').div(environment.minimumDepositAmount);
        console.log(`\tBlock number: ${await ethers.provider.getBlockNumber()}`);
        console.log('\t[Before balances]');
        for (let bonusInfo of bonusesInfo) {
            const bonusContract = await ethers.getContractAt(erc20Sol.abi, bonusInfo.tokenAddress);
            const userBalance = await bonusContract.balanceOf(environment.guest1Signer.address);
            console.log(`\t\t${bonusContract.address}: ${formatEther(userBalance)} (${userBalance} wei)`);
        }
        // Use last bonus starting block as the userLastVaultDividendBlock
        const userLastVaultDividendBlock: BigNumber = bonusesInfo[bonusesInfo.length - 1].startingBlock;
        await environment.hellVaultBonusContract._distributeBonuses(
            environment.guest1Signer.address,
            userLastVaultDividendBlock,
            stakeToReward
        );
        const blockNumber: number = await ethers.provider.getBlockNumber();
        const blocksElapsed: BigNumber = BigNumber.from(blockNumber).sub(userLastVaultDividendBlock);
        console.log(`\tBlock number: ${blockNumber}`);
        console.log('\t[After balances]');
        for (let bonusInfo of bonusesInfo) {
            const bonusContract = await ethers.getContractAt(erc20Sol.abi, bonusInfo.tokenAddress);
            const userBalance = await bonusContract.balanceOf(environment.guest1Signer.address);
            console.log(`\t\t${bonusContract.address}: ${formatEther(userBalance)} (${userBalance} wei)`);
        }
    });
}
