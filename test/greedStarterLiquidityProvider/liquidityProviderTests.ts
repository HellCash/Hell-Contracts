import {greedStarterTestingEnvironment} from "../greedStarter/@greedStarterTestingEnvironment";
import {deployUniswapV2LiquidityProvider} from "../../scripts/deployments/deployUniswapV2LiquidityProvider";
import {Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

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

}