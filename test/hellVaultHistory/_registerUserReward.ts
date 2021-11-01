import {HellVaultHistoryTestingEnvironment} from "./@hellVaultHistoryTestingEnvironment";
import {expect} from "chai";
import {EtherUtils} from "../../utils/etherUtils";
import {parseEther} from "ethers/lib/utils";
import {ClaimMode} from "../../enums/claimMode";
import {BigNumber} from "ethers";
import {Random} from "../../utils/random";

export function _registerUserReward() {
    let environment: HellVaultHistoryTestingEnvironment = new HellVaultHistoryTestingEnvironment();

    before(async () => {
        await environment.initialize();
        // We'll use the master signer as the HellVault
        await environment.hellVaultHistoryContract._setHellVaultAddress(environment.masterSigner.address);
        // We'll use the treasury address as the HellVaultBonus
        await environment.hellVaultHistoryContract._setHellVaultBonusAddress(environment.treasurySigner.address);
    });

    it('Should fail if not called by the Hell Vault or Hell Vault Bonus Contracts', async() => {
        await expect(environment.hellVaultHistoryContract
            .connect(environment.guest1Signer) // <----- REVERT
            ._registerUserReward(
                environment.masterSigner.address,
                EtherUtils.zeroAddress(),
                parseEther('1'),
                ClaimMode.SendToVault
            )).to.be.revertedWith("Forbidden");
    });

    it('[HellVault] Should register the user reward', async() => {
        const amount = parseEther(Random.randomNumber(1, 1e10).toFixed(18));
        const totalUserRewards: BigNumber = await environment.hellVaultHistoryContract
            ._userTotalRewards(environment.masterSigner.address);
        await expect(environment.hellVaultHistoryContract
            .connect(environment.masterSigner) // We are using the master signer as the Hell Vault Contract
            ._registerUserReward(
                environment.masterSigner.address,
                EtherUtils.zeroAddress(),
                amount,
                ClaimMode.SendToVault
            )).to.emit(environment.hellVaultHistoryContract, 'RewardRegistered')
            .withArgs(totalUserRewards.add(1), environment.masterSigner.address, EtherUtils.zeroAddress(), amount);
    });

    it('[HellVaultBonus] Should register the user reward', async() => {
        const amount = parseEther(Random.randomNumber(1, 1e10).toFixed(18));
        const totalUserRewards: BigNumber = await environment.hellVaultHistoryContract
            ._userTotalRewards(environment.masterSigner.address);
        await expect(environment.hellVaultHistoryContract
            .connect(environment.treasurySigner) // We are using the treasury signer as the Hell Vault Bonus Contract
            ._registerUserReward(
                environment.masterSigner.address,
                EtherUtils.zeroAddress(),
                amount,
                ClaimMode.SendToVault
            )).to.emit(environment.hellVaultHistoryContract, 'RewardRegistered')
            .withArgs(totalUserRewards.add(1), environment.masterSigner.address, EtherUtils.zeroAddress(), amount);
    });
}