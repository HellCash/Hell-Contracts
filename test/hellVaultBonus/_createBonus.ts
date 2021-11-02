import {HellVaultBonusTestingEnvironment} from "./@hellVaultBonusTestingEnvironment";
import {expect} from "chai";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {BigNumber, Contract} from "ethers";
import {deployDoublon} from "../../scripts/deployments/deployDoublon";
import {testingEnvironmentDeploymentOptions} from "../../models/deploymentOptions";
import {Random} from "../../utils/random";
import {HellVaultBonusInfo} from "../../models/hellVaultBonusInfo";

export function _createBonus() {
    let doublonContract: Contract;
    let environment: HellVaultBonusTestingEnvironment = new HellVaultBonusTestingEnvironment();

    before(async () => {
        await environment.initialize();
        doublonContract = await deployDoublon(testingEnvironmentDeploymentOptions);
    });

    it('Should fail if not called by the owner', async() => {
        await expect(environment.hellVaultBonusContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._createBonus(
                doublonContract.address, // tokenAddress
                parseEther('1000'),// amount
                parseUnits('5', 12),// rewardPerBlock
            )).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('[CB1] Should fail if the amount or rewardPerBlock are zero', async() => {
        await expect(environment.hellVaultBonusContract
            ._createBonus(
                doublonContract.address, // tokenAddress
                0, // amount <---- REVERT: The Amount cannot be zero
                parseUnits('5', 12),// rewardPerBlock
            )).to.be.revertedWith("CB1");

        await expect(environment.hellVaultBonusContract
            ._createBonus(
                doublonContract.address, // tokenAddress
                parseEther('1111'), // amount
                0, // rewardPerBlock <---- REVERT: The rewardPerBlock cannot be zero
            )).to.be.revertedWith("CB1");
    });

    it('[CB2] Should fail if the amount of dividends is lower than the minimum', async() => {
        const minimumDividends: BigNumber = await environment.hellVaultBonusContract._minimumDividendsPerReward();
        const amount = parseEther(Random.randomNumber(1, 2000).toFixed(18));
        const rewardPerBlock = amount.div(minimumDividends.sub(10));
        await expect(environment.hellVaultBonusContract
            ._createBonus(
                doublonContract.address, // tokenAddress
                amount, // amount
                rewardPerBlock,// rewardPerBlock <---- REVERT: We are providing less that the minimum amount of dividends
            )).to.be.revertedWith("CB2");
    });

    it('Should create a Bonus', async() => {
        // Set variables
        const totalBonuses: BigNumber = await environment.hellVaultBonusContract._totalBonuses();
        const tokenAddress: string = doublonContract.address;
        const amount: BigNumber = parseEther('10000');
        const rewardPerBlock: BigNumber = parseUnits('5', 12);
        // Increase allowances
        await doublonContract.approve(environment.hellVaultBonusContract.address, amount);
        // Create the Bonus
        await expect(environment.hellVaultBonusContract._createBonus(
            tokenAddress,
            amount,
            rewardPerBlock,
        )).to.emit(environment.hellVaultBonusContract, 'BonusCreated')
            .withArgs(totalBonuses.add(1), doublonContract.address, amount, rewardPerBlock);
        // Find the newly created bonus
        const bonusInfo: HellVaultBonusInfo = await environment.hellVaultBonusContract._bonusInfo(totalBonuses.add(1));
        // expect that the bonus was registered
        expect(bonusInfo.id).not.equal(BigNumber.from(0));
        // expect that the bonus startingBlock was set to 0
        expect(bonusInfo.startingBlock).to.be.equal(BigNumber.from(0));
        // expect that the bonus was marked as ended
        expect(bonusInfo.endedAtBlock).not.equal(BigNumber.from(0));
    });
}