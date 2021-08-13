import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {HellTestHelpers} from "../../helpers/HellTestHelpers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {GreedStarterHelpers} from "../../helpers/GreedStarterHelpers";
import contractAddresses from "../../scripts/contractAddresses.json";
import {ContractTestHelpers} from "../../helpers/ContractTestHelpers";
import {Project} from "../../models/project";
import {EtherUtils} from "../../utils/ether-utils";


describe('[Greed Starter] function invest', async () => {
    let masterSigner: any;
    let guest1Signer: any;
    let guest2Signer: any;
    let treasurySigner: any;
    let doublonProjectId: BigNumber;
    let hellProjectId: BigNumber;
    let hellProjectIdPaidWithDoublon: BigNumber;
    before(async() => {
        const accountSigners = await ethers.getSigners();
        masterSigner = accountSigners[0];
        guest1Signer = accountSigners[1];
        guest2Signer = accountSigners[2];
        treasurySigner = accountSigners[3];


        const currentBlock = await ethers.provider.getBlockNumber();
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);

        // Increase the allowance and transfer some FUSD to guest1
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(masterSigner);
        await fusdContract.transfer(guest1Signer.address, parseUnits('250000',6));

        // First we increase the allowances of the master signer
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(masterSigner);
        await doublonContract.approve(contractAddresses.greedStarter, parseEther("12500"));

        // Transfer some Doublon to guest2
        await doublonContract.transfer(guest2Signer.address, parseUnits('10000'));

        // First we increase the allowances of the master signer
        const hellContract: Contract = await HellTestHelpers.getHellContract(masterSigner);
        await hellContract.approve(contractAddresses.greedStarter, parseEther("100"));

        const totalProjects: BigNumber = await greedStarterContract._totalProjects();
        const startingBlock = currentBlock + 15;



        await greedStarterContract.createProject(
            doublonContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            startingBlock + 5, // Starting block
            currentBlock + 115, // Ending block
            parseEther("0.02"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );

        doublonProjectId = totalProjects.add(1);


        await greedStarterContract.createProject(
            hellContract.address, // Token address
            fusdContract.address, // Address of paying currency
            parseEther("50"), // Total Tokens
            startingBlock + 5, // Starting block
            currentBlock + 115, // Ending block
            parseUnits("5000",6), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("45"), // Maximum Purchase
        );

        hellProjectId = totalProjects.add(2);

        await greedStarterContract.createProject(
            hellContract.address, // Token address
            doublonContract.address, // Address of paying currency
            parseEther("40"), // Total Tokens
            startingBlock + 5, // Starting block
            currentBlock + 200, // Ending block
            parseEther("500"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("30"), // Maximum Purchase
        );

        hellProjectIdPaidWithDoublon = totalProjects.add(3);

    });

    it('Should fail if the project doesn\'t exists', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.invest(BigNumber.from(1240),parseEther("80")))
            .to.be.revertedWith('I1');
    });

    it('Should fail if the creator invests on his own project', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(masterSigner);
        await expect(greedStarterContract.invest(doublonProjectId, parseEther("80")))
            .to.be.revertedWith('I2');
    });

    it('Should fail if the project hasn\'t started yet', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        await expect(greedStarterContract.invest(doublonProjectId, parseEther("80")))
            .to.be.revertedWith('I4');

        await expect(greedStarterContract.invest(hellProjectId, parseEther("80")))
            .to.be.revertedWith('I4');
    });

    it('You can\'t purchase less than the minimum amount', async() => {
        // Mine some blocks until project starts

        for (let i = 0; i < 15; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer)
        await expect(greedStarterContract.invest(doublonProjectId,parseEther("1")))
           .to.be.revertedWith('I6');

    });

    it('Should fail if the user already purchased the maximum amount available per wallet', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer)
        await expect(greedStarterContract.invest(doublonProjectId,parseEther("80")))
            .to.be.revertedWith('I7');

    });

    it('Paid with ETHER: Should perform an investment', async() => {
        // Mine some blocks until project starts
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);

        const amountToBuy = parseEther('3');
        const project: Project = await greedStarterContract._projects(doublonProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(doublonProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(doublonProjectId, guest1Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        await expect(greedStarterContract.invest(doublonProjectId, amountToBuy, {
            value: amountToPay
         })).to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                doublonProjectId,
                guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(doublonProjectId, guest1Signer.address));
    });

    it('Paid with ETHER: Should increase the investment', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);

        const amountToBuy = parseEther('15');
        const project: Project = await greedStarterContract._projects(doublonProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(doublonProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(doublonProjectId, guest1Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await expect(greedStarterContract.invest(doublonProjectId, amountToBuy,{
            value: amountToPay
        })).to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                doublonProjectId,
                guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(doublonProjectId, guest1Signer.address));
    });

    it('Paid with FUSD: Should perform an investment', async() => {
        // Mine some blocks until project starts
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1Signer);

        const amountToBuy = parseEther('3');
        const project: Project = await greedStarterContract._projects(hellProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectId, guest1Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        await fusdContract.approve(contractAddresses.greedStarter, amountToPay);
        await expect(greedStarterContract.invest(hellProjectId, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectId,
                guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectId, guest1Signer.address));
    });

    it('Paid with FUSD: Should increase the investment', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer);
        const fusdContract: Contract = await ContractTestHelpers.getFUSDContract(guest1Signer);

        const amountToBuy = parseEther('25');
        const project: Project = await greedStarterContract._projects(hellProjectId);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectId, guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectId, guest1Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await fusdContract.approve(contractAddresses.greedStarter, amountToPay);
        await expect(greedStarterContract.invest(hellProjectId, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectId,
                guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectId, guest1Signer.address));
    });

    it('Paid with ERC20: Should perform an investment', async() => {
        // Mine some blocks until project starts
        for (let i = 0; i < 10; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest2Signer);
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(guest2Signer);
        const amountToBuy = parseEther('4');
        const project: Project = await greedStarterContract._projects(hellProjectIdPaidWithDoublon);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithDoublon, guest2Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, guest2Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        await doublonContract.approve(contractAddresses.greedStarter, amountToPay);
        await expect(greedStarterContract.invest(hellProjectIdPaidWithDoublon, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithDoublon,
                guest2Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, guest2Signer.address));
    });

    it('Paid with ERC20: Should increase the investment', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest2Signer);
        const doublonContract: Contract = await ContractTestHelpers.getDoublonContract(guest2Signer);

        const amountToBuy = parseEther('10');
        const project: Project = await greedStarterContract._projects(hellProjectIdPaidWithDoublon);
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithDoublon, guest2Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, guest2Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await doublonContract.approve(contractAddresses.greedStarter, amountToPay);
        await expect(greedStarterContract.invest(hellProjectIdPaidWithDoublon, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithDoublon,
                guest2Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, guest2Signer.address));
    });

    it('Not enough tokens available to perform this purchase', async() => {
        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer)
        await expect(greedStarterContract.invest(doublonProjectId,parseEther('50000')))
            .to.be.revertedWith('I5');

    });

    it('Should fail if the project already finished', async() => {
        // Mine some block to ensure the project has ended
        for (let i = 0; i < 120; i++) {
            await ethers.provider.send('evm_mine', []);
        }

        const greedStarterContract: Contract = await GreedStarterHelpers.getGreedStarterContract(guest1Signer)
        await expect(greedStarterContract.invest(doublonProjectId,parseEther('50')))
            .to.be.revertedWith('I3');

    });

});