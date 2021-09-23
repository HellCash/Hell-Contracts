import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {parseEther, parseUnits} from "ethers/lib/utils";
import {expect} from "chai";
import {Project} from "../../models/project";
import {EtherUtils} from "../../utils/ether-utils";
import {greedStarterTestingEnvironment} from "./@greedStarterTestingEnvironment";
import {NetworkUtils} from "../../utils/network-utils";

export function invest() {
    let doublonProjectIdPaidWithEther: BigNumber;
    let hellProjectIdPaidWithFusd: BigNumber;
    let hellProjectIdPaidWithDoublon: BigNumber;

    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();

    before(async() => {
        await environment.initialize();

        const currentBlock = await ethers.provider.getBlockNumber();
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        const startingBlock = currentBlock + 15;

        // Transfer funds from the master signer to the guest1 signer
        await environment.fusdContract.transfer(environment.guest1Signer.address, parseUnits("40000", 6));
        await environment.doublonContract.transfer(environment.guest2Signer.address, parseEther("10000"));

        await environment.doublonContract.approve(environment.greedStarterContract.address, parseEther("200"));
        await environment.greedStarterContract.createProject(
            environment.doublonContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("200"), // Total Tokens
            startingBlock + 5, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.02"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("50"), // Maximum Purchase
        );

        doublonProjectIdPaidWithEther = totalProjects.add(1);

        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("50"));
        await environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.fusdContract.address, // Address of paying currency
            parseEther("50"), // Total Tokens
            startingBlock + 5, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseUnits("5000",6), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("45"), // Maximum Purchase
        );

        hellProjectIdPaidWithFusd = totalProjects.add(2);

        await environment.hellContract.approve(environment.greedStarterContract.address, parseEther("40"));
        await environment.greedStarterContract.createProject(
            environment.hellContract.address, // Token address
            environment.doublonContract.address, // Address of paying currency
            parseEther("40"), // Total Tokens
            startingBlock + 5, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("500"), // Price per token
            parseEther("2"), // Minimum purchase
            parseEther("30"), // Maximum Purchase
        );

        hellProjectIdPaidWithDoublon = totalProjects.add(3);

    });

    it('Should fail if the project doesn\'t exists', async() => {
        await expect(environment.greedStarterContract.invest(BigNumber.from(1240),parseEther("80")))
            .to.be.revertedWith('I1');
    });

    it('Should fail if the creator invests on his own project', async() => {
        await expect(environment.greedStarterContract.invest(doublonProjectIdPaidWithEther, parseEther("80")))
            .to.be.revertedWith('I2');
    });

    it('Should fail if the project hasn\'t started yet', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);

        await expect(greedStarterContract.invest(doublonProjectIdPaidWithEther, parseEther("80")))
            .to.be.revertedWith('I4');

        await expect(greedStarterContract.invest(hellProjectIdPaidWithFusd, parseEther("80")))
            .to.be.revertedWith('I4');
    });

    it('You can\'t purchase less than the minimum amount', async() => {
        // Mine some blocks until project starts
        await NetworkUtils.mineBlocks(15);
        await expect(environment.greedStarterContract.connect(environment.guest1Signer)
            .invest(
                doublonProjectIdPaidWithEther,
                parseEther("1")  // <----- REVERT
            )).to.be.revertedWith('I6');
    });

    it('Should fail if the user already purchased the maximum amount available per wallet', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer)
            .invest(
                doublonProjectIdPaidWithEther,
                parseEther("80") // <---- REVERT
            ))
            .to.be.revertedWith('I7');
    });

    it('DOUBLON/ETHER: Should perform an investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);
        const amountToBuy = parseEther('3');
        const project: Project = (await greedStarterContract.getProjects([doublonProjectIdPaidWithEther]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(doublonProjectIdPaidWithEther, environment.guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(doublonProjectIdPaidWithEther, environment.guest1Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        await expect(greedStarterContract.invest(doublonProjectIdPaidWithEther, amountToBuy, {
            value: amountToPay
         })).to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                doublonProjectIdPaidWithEther,
                environment.guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(doublonProjectIdPaidWithEther, environment.guest1Signer.address));
    });

    it('DOUBLON/ETHER: Should increase the investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);
        const amountToBuy = parseEther('15');
        const project: Project = (await greedStarterContract.getProjects([doublonProjectIdPaidWithEther]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(doublonProjectIdPaidWithEther, environment.guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(doublonProjectIdPaidWithEther, environment.guest1Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await expect(greedStarterContract.invest(doublonProjectIdPaidWithEther, amountToBuy,{
            value: amountToPay
        })).to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                doublonProjectIdPaidWithEther,
                environment.guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(doublonProjectIdPaidWithEther, environment.guest1Signer.address));
    });

    it('HELL/FUSD: Should perform an investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);

        const amountToBuy = parseEther('3');
        const project: Project = (await greedStarterContract.getProjects([hellProjectIdPaidWithFusd]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithFusd, environment.guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithFusd, environment.guest1Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        // Increase guest1 allowances
        await environment.fusdContract.connect(environment.guest1Signer).approve(environment.greedStarterContract.address, amountToPay);

        await expect(greedStarterContract.invest(hellProjectIdPaidWithFusd, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithFusd,
                environment.guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithFusd, environment.guest1Signer.address));
    });

    it('HELL/FUSD: Should increase the investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest1Signer);

        const amountToBuy = parseEther('5');
        const project: Project = (await greedStarterContract.getProjects([hellProjectIdPaidWithFusd]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithFusd, environment.guest1Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithFusd, environment.guest1Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await environment.fusdContract.connect(environment.guest1Signer).approve(environment.greedStarterContract.address, amountToPay);
        await expect(greedStarterContract.invest(hellProjectIdPaidWithFusd, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithFusd,
                environment.guest1Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithFusd, environment.guest1Signer.address));
    });

    it('HELL/DOUBLON: Should perform an investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest2Signer);
        const amountToBuy = parseEther('4');
        const project: Project = (await greedStarterContract.getProjects([hellProjectIdPaidWithDoublon]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithDoublon, environment.guest2Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, environment.guest2Signer.address);
        const amountToPay: BigNumber = (project.pricePerToken.mul(amountToBuy)).div(parseEther("1"));

        await environment.doublonContract.connect(environment.guest2Signer).approve(environment.greedStarterContract.address, amountToPay);
        await expect(greedStarterContract.invest(hellProjectIdPaidWithDoublon, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithDoublon,
                environment.guest2Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, environment.guest2Signer.address));
    });

    it('HELL/DOUBLON: Should increase the investment', async() => {
        const greedStarterContract: Contract = environment.greedStarterContract.connect(environment.guest2Signer);

        const amountToBuy = parseEther('10');
        const project: Project = (await greedStarterContract.getProjects([hellProjectIdPaidWithDoublon]))[0];
        const totalPaid: BigNumber = await greedStarterContract._paidAmount(hellProjectIdPaidWithDoublon, environment.guest2Signer.address);
        const totalRewards: BigNumber = await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, environment.guest2Signer.address);
        const amountToPay: BigNumber = ((project.pricePerToken).mul(amountToBuy)).div(parseEther("1"));

        await environment.doublonContract.connect(environment.guest2Signer).approve(environment.greedStarterContract.address, amountToPay);
        await expect(greedStarterContract.invest(hellProjectIdPaidWithDoublon, amountToBuy))
            .to.emit(greedStarterContract, 'InvestedInProject')
            .withArgs(
                hellProjectIdPaidWithDoublon,
                environment.guest2Signer.address,
                amountToPay,
                amountToBuy,
                totalPaid.add(amountToPay),
                totalRewards.add(amountToBuy),
            );
        expect(totalRewards.add(amountToBuy)).to.be.equal(await greedStarterContract._pendingRewards(hellProjectIdPaidWithDoublon, environment.guest2Signer.address));
    });

    it('Not enough tokens available to perform this purchase', async() => {
        await expect(environment.greedStarterContract.connect(environment.guest1Signer).invest(doublonProjectIdPaidWithEther,parseEther('50000')))
            .to.be.revertedWith('I5');

    });

    it('Should fail if the project already finished', async() => {
        // Mine some block to ensure the project has ended
        await NetworkUtils.mineBlocks(200);

        await expect(environment.greedStarterContract.connect(environment.guest1Signer).invest(doublonProjectIdPaidWithEther,parseEther('50')))
            .to.be.revertedWith('I3');
    });

}