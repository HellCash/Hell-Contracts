import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {formatEther, parseEther} from "ethers/lib/utils";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import {EtherUtils} from "../../utils/ether-utils";
import contractAddresses from "../../scripts/contractAddresses.json";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";

describe('[Greed Starter] function invest', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;
    let treasurySigner: any;
    let doublonProjectId: BigNumber;
    let hellProjectId: BigNumber;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
        treasurySigner = accountSigners[3];

        const currentBlock = await ethers.provider.getBlockNumber();
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);

        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
        await doublonContract.approve(contractAddresses.greedStarter, parseEther("1250000"));

        await doublonContract.transfer(guest1Signer.address, parseEther("25000"));
        await doublonContract.transfer(guest2Signer.address, parseEther("35000"));

        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(contractAddresses.greedStarter, parseEther("100"));

        const totalProjects: BigNumber = await greedStarterContract._totalProjects();
        const startingBlock = currentBlock + 25;

        doublonProjectId = totalProjects.add(1);
        await greedStarterContract.createProject(
            doublonContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("500000"), // Total Tokens
            startingBlock, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("0.05"), // Price per token
        );

        hellProjectId = totalProjects.add(2);
        await greedStarterContract.createProject(
            hellContract.address, // Token address
            doublonContract.address, // Address of paying currency
            parseEther("50"), // Total Tokens
            startingBlock, // Starting block
            currentBlock + 5500, // Ending block
            parseEther("10000"), // Price per token
        );
        console.log('hell project should start at block: ' + startingBlock);
    });

    it('Should fail if the project doesn\'t exists', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        await expect(greedStarterContract.invest(BigNumber.from(1240), parseEther('124')))
            .to.be.revertedWith('IP1');
    });

    it('Should fail if the creator invests on his own project', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        await expect(greedStarterContract.invest(doublonProjectId, parseEther('20')))
            .to.be.revertedWith('IP2');
    });

    it('Should fail if the project hasn\'t started yet', async() => {
        // IP4
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.invest(doublonProjectId, parseEther('20')))
            .to.be.revertedWith('IP4');

        await expect(greedStarterContract.invest(hellProjectId, parseEther('20')))
            .to.be.revertedWith('IP4');
    });

    it('Should fail if there aren\'t enough tokens available to perform the purchase', async() => {
        // IP6
        throw "Not implemented";
    });

    it('Should fail if the user already purchased the maximum amount available per wallet', async() => {
        // Expect to be reverted with IP6
        throw "Not Implemented";
    });

    it('Should fail if the user tries to buy less than the specified minimum amount', async() => {
        // Expect to be reverted with IP7
        throw "Not Implemented";
    });

    it('Should perform an investment', async() => {
        // Mine some blocks until project starts
        for (let i = 0; i < 25; i++) {
            await ethers.provider.send('evm_mine', []);
        }
        // console.log('\t\t current block: ' + await ethers.provider.getBlockNumber());

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(guest1Signer);
        await doublonContract.approve(contractAddresses.greedStarter, parseEther("50000"));

        const amountToPay = parseEther('12500');
        const project: any = await greedStarterContract._projects(hellProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._rewardedAmount(hellProjectId, guest1Signer.address);
        const expectedRewards: BigNumber = parseEther("1").mul(amountToPay).div(project.pricePerToken);
        // console.log(`\t\texpected rewards: ${expectedRewards.toString()}  |  ${formatEther(expectedRewards)}`)
        await expect(greedStarterContract.invest(hellProjectId, amountToPay))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectId,
                guest1Signer.address,
                amountToPay,
                expectedRewards,
                totalPaid.add(amountToPay),
                totalRewards.add(expectedRewards),
            );
        expect(totalRewards.add(expectedRewards)).to.be.equal(await greedStarterContract._rewardedAmount(hellProjectId, guest1Signer.address));
    });

    it('Should increase the investment', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const amountToPay = parseEther('12500');
        const project: any = await greedStarterContract._projects(hellProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._rewardedAmount(hellProjectId, guest1Signer.address);
        const expectedRewards: BigNumber = parseEther("1").mul(amountToPay).div(project.pricePerToken);
        // console.log(`\t\texpected rewards: ${expectedRewards.toString()}  |  ${formatEther(expectedRewards)}`)
        await expect(greedStarterContract.invest(hellProjectId, amountToPay))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectId,
                guest1Signer.address,
                amountToPay,
                expectedRewards,
                totalPaid.add(amountToPay),
                totalRewards.add(expectedRewards),
            );
        expect(totalRewards.add(expectedRewards)).to.be.equal(await greedStarterContract._rewardedAmount(hellProjectId, guest1Signer.address));
    });

    it('Not enough tokens available to perform this purchase', async() => {
        throw "Not implemented";
    });

    it('Should fail if the project already finished', async() => {
        // IP3
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        throw "Not implemented";
    });

});