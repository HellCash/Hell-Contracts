import {ethers, upgrades} from "hardhat";
import {Console} from "../../utils/console";
import {Contract} from "ethers";
import {defaultDeploymentOptions} from "../../models/deploymentOptions";

export async function deployUniswapV2LiquidityProvider(
    greedStarterContractAddress: string,
    greedStarterIndexerContractAddress: string,
    uniswapV2FactoryContractAddress: string,
    uniswapV2Router02ContractAddress: string,
    deploymentOptions = defaultDeploymentOptions
): Promise<Contract> {
    const uniswapV2LiquidityProviderContract = await (await ethers.getContractFactory("UniswapV2LiquidityProvider")).deploy(
        greedStarterContractAddress,
        greedStarterIndexerContractAddress,
        uniswapV2FactoryContractAddress,
        uniswapV2Router02ContractAddress
    );
    if (deploymentOptions.printLogs) {
        await Console.contractDeploymentInformation("UniswapV2LiquidityProviderContract", uniswapV2LiquidityProviderContract);
    }
    return uniswapV2LiquidityProviderContract;
}