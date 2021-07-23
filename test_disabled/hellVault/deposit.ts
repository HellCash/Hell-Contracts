import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import contractAddresses from "../../scripts/contractAddresses.json";
import {HellVaultTestHelpers} from "../../helpers/HellVaultTestHelpers";
import {HellVaultUserInfo} from "../../models/hell-vault-user-info";

describe('[Hell Vault] function deposit', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;
    let guest3Signer: any;

    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
        guest3Signer = accountSigners[3];

        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.transfer(guest3Signer.address, parseEther('30'));
    });

    it('Should fail if user doesn\'t have enough funds', async () => {
        const hellVaultContract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest3Signer);
        // Guest 3 doesnt have enough balance for this, the transaction should revert
        await expect(hellVaultContract.deposit(parseEther("35")))
            .to.be.revertedWith('You don\'t have enough funds');
    });

    it('Should fail if user doesn\'t have enough allowance', async () => {
        const hellVaultContract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest3Signer);
        // Guest 3 doesnt have any allowance
        await expect(hellVaultContract.deposit(parseEther("23")))
            .to.be.revertedWith('You don\'t have enough allowance');
    });

    it('Should fail if deposited amount is lower than 0.0001', async () => {
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest3Signer);
        await hellContract.approve(contractAddresses.hellVault, parseEther("1"));

        const hellVaultContract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest3Signer);
        await expect(hellVaultContract.deposit(parseEther("0.00001")))
            .to.be.revertedWith('Deposit must be >= 0.0001 HELL');
    });

    it('Should transfer user funds to the Hell Vault successfully', async () => {
        const depositedAmount = parseEther("15");
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest3Signer);
        await hellContract.approve(contractAddresses.hellVault, depositedAmount);
        const hellVaultContract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest3Signer);
        const beforeUserInfo: HellVaultUserInfo = await hellVaultContract.getUserInfo(guest3Signer.address);

        await expect(hellVaultContract.deposit(depositedAmount))
            .to.emit(hellVaultContract, 'Deposit')
            .withArgs(guest3Signer.address, depositedAmount);
        const afterUserInfo: HellVaultUserInfo = await hellVaultContract.getUserInfo(guest3Signer.address);

        expect(beforeUserInfo.distributedDividendsSinceLastPayment).to.not.be.equal(afterUserInfo.distributedDividendsSinceLastPayment);
        expect(beforeUserInfo.hellDeposited?.add(depositedAmount)).to.be.equal(afterUserInfo.hellDeposited);
        expect(beforeUserInfo.lastDividendBlock).to.be.lt(afterUserInfo.lastDividendBlock);
    });

    it('Should compound pending rewards after a successful deposit', async() => {
        before(async() => {
            // mine 20 blocks
            for (let i = 0; i < 20; i++) {
                await ethers.provider.send('evm_mine', []);
            }
        });

        let depositedAmount = parseEther("15");
        const hellContract: Contract = await HellTestHelpers.getHellContract(guest3Signer);
        await hellContract.approve(contractAddresses.hellVault, depositedAmount);
        const hellVaultContract: Contract = await HellVaultTestHelpers.getHellVaultContract(guest3Signer);
        const beforeUserInfo: HellVaultUserInfo = await hellVaultContract.getUserInfo(guest3Signer.address);

        // @ts-ignore
        const expectedRewards: BigNumber = beforeUserInfo.hellRewarded;

        await expect(hellVaultContract.deposit(depositedAmount))
            .to.emit(hellVaultContract, 'Deposit')
            .withArgs(guest3Signer.address, depositedAmount);

        depositedAmount = depositedAmount.add(expectedRewards);

        const afterUserInfo: HellVaultUserInfo = await hellVaultContract.getUserInfo(guest3Signer.address);

        expect(beforeUserInfo.distributedDividendsSinceLastPayment).to.not.be.equal(afterUserInfo.distributedDividendsSinceLastPayment);
        expect(beforeUserInfo.hellDeposited?.add(depositedAmount)).to.be.equal(afterUserInfo.hellDeposited);
        expect(beforeUserInfo.lastDividendBlock).to.be.lt(afterUserInfo.lastDividendBlock);
    });
});