import {expect} from "chai";
import {BigNumber} from "ethers";
import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {parseEther, parseUnits} from "ethers/lib/utils";

abstract class TestScenario {
    sender: string;
    receipt: string;
    amount: BigNumber;
}

export function calculateBurnFees() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    let testScenarios: TestScenario[] = [];
    before(async () => {
        await environment.initialize();
        // Attempt with every unit, from 1 to 18 decimals
        for (let i = 1; i < 18; i++) {
            testScenarios.push(
                {
                    sender: environment.guest1Signer.address,
                    receipt: environment.guest2Signer.address,
                    amount: parseUnits("1", i),
                }
            );
        }
        // Attempt with random values between 1 and 666
        for (let i = 1; i < 100; i++) {
            const randomAmount = Math.floor(Math.random() * 666) + 1;
            testScenarios.push(
                {
                    sender: environment.guest1Signer.address,
                    receipt: environment.guest2Signer.address,
                    amount: parseEther(randomAmount.toString()),
                }
            );
        }
    });

    it(`Should calculate the right amount of fees`, async () => {
        const currentBurnFee: BigNumber = await environment.hellContract._burnFee();
        for (const testScenario of testScenarios) {
            const expectedBurnedFees = currentBurnFee.mul(testScenario.amount.div(100));
            const burnedFees = await environment.hellContract
                .calculateBurnFees(testScenario.sender, testScenario.receipt, testScenario.amount);
            expect(expectedBurnedFees).to.be.equal(burnedFees);
        }
    });
}