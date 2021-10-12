import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {deployUniswapV2LiquidityProvider} from "../../scripts/deployments/deployUniswapV2LiquidityProvider";
import {BigNumber, Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";
import {Project} from "../../models/project";
import {EtherUtils} from "../../utils/etherUtils";
import {parseEther} from "ethers/lib/utils";
import {ethers} from "hardhat";
import {expect} from "chai";

export function liquidityProviderTests() {
    let environment: greedStarterTestingEnvironment = new greedStarterTestingEnvironment();
    let uniswapV2LiquidityProvider: Contract;

    before(async() => {
        await environment.initialize();
        // We'll test with UniswapV2 from Ethereum
        uniswapV2LiquidityProvider = await deployUniswapV2LiquidityProvider (
            environment.greedStarterContract.address,
            environment.greedStarterIndexerContract.address,
            '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // UniswapV2Factory
            '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' // UniswapV2Router02
        , defaultDeploymentOptions);
    });

    let project: Project;
    it('Should create a new project', async() => {
        // Increase Allowance
        await environment.hellContract.approve(uniswapV2LiquidityProvider.address, parseEther("200"));
        const currentBlock = await ethers.provider.getBlockNumber();
        const totalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        await uniswapV2LiquidityProvider.createProject(
            environment.hellContract.address, // Token address
            EtherUtils.zeroAddress(), // Address of paying currency
            parseEther("100"), // Total Tokens
            currentBlock + 25, // Starting block
            environment.minimumProjectLength.mul(2).add(currentBlock), // Ending block
            parseEther("0.001"), // Price per token
            parseEther("1"), // Minimum purchase
            parseEther("10"), // Maximum Purchase
            parseEther("100") // Initial Liquidity
        );
        const afterTotalProjects: BigNumber = await environment.greedStarterContract._totalProjects();
        // Verify if the total number of projects Increased
        expect(afterTotalProjects).to.be.equal(totalProjects.add(1));
        // Retrieve the project details
        project = (await environment.greedStarterContract.getProjects([afterTotalProjects]))[0];
    });
}