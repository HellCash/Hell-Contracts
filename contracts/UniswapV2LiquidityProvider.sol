// SPDX-License-Identifier: BUSL-1.1
// HellCash
// https://hell.cash
//////////////////////////////////////////

pragma solidity ^0.8.7;
import "./GreedStarter.sol";
import "./external/uniswap/interfaces/IUniswapV2Router02.sol";
import "./external/uniswap/interfaces/IUniswapV2Factory.sol";
import "./interfaces/GreedStarterInterface.sol";
import "./libraries/HellishTransfers.sol";
import "./GreedStarterIndexer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapV2LiquidityProvider is Ownable, AccessControl {
    GreedStarterInterface public immutable _greedStarter;
    GreedStarterIndexer public immutable _indexer;
    IUniswapV2Factory public immutable _uniswapV2Factory;
    IUniswapV2Router02 public immutable _uniswapV2Router;

    using HellishTransfers for address;
    using HellishTransfers for address payable;
    // Project Details
    uint _projectId;
    address _offeredTokenAddress;
    address _paidWithTokenAddress;
    uint _pricePerToken;
    uint _minimumPurchase;
    uint _maximumPurchase;
    ///////////////////////////////////
    uint _initialOfferedTokenLiquidity;
    // Flags
    bool _fundsClaimed;

    constructor(
        address greedStarterContractAddress,
        address greedStarterIndexerContractAddress,
        address uniswapV2FactoryContractAddress,
        address uniswapV2Router02ContractAddress
    ) {
        _greedStarter = GreedStarterInterface(greedStarterContractAddress);
        _indexer = GreedStarterIndexer(greedStarterIndexerContractAddress);
        _uniswapV2Factory = IUniswapV2Factory(uniswapV2FactoryContractAddress);
        _uniswapV2Router = IUniswapV2Router02(uniswapV2Router02ContractAddress);
    }

    /*
        @param tokenAddress Token being offered, this is what users will receive after investing
        @param paidWith Address of the token used to invest, this is what users will have to pay
               in order to place investments. If this value is set to the zero address 0x0000000000....
               the network currency will be used.
        @param totalTokens Total amount of tokens available for sale on this project.
        @param startingBlock Block in which the project will begin to be available for investments.
        @param endsAtBlock Block in which the project will no longer be available for investments.
        @param pricePerToken Defines how much 1 unit of the "tokenAddress" costs against the "paidWith" token.
        @param minimumPurchase Minimum amount that any user can purchase.
        @param maximumPurchase Maximum amount that any user can purchase.
        @param tokenLiquidity Number of tokens being offered, to be added to the liquidity pool
                              along with all the collected liquidity
    */
    function createProject(
        address payable offeredTokenAddress,
        address payable paidWith,
        uint totalTokens,
        uint startingBlock,
        uint endsAtBlock,
        uint pricePerToken,
        uint minimumPurchase,
        uint maximumPurchase,
        uint initialOfferedTokenLiquidity
    ) external onlyOwner {
        // Make sure the project hasn't been initialized yet
        require(_projectId == 0, "Project was already created");
        // Token Liquidity cannot be zero
        require(initialOfferedTokenLiquidity > 0, "You must provide some tokens for Liquidity");
        // Deposit offeredTokens in the Provider
        payable(address(this)).safeDepositAsset(offeredTokenAddress, (totalTokens + initialOfferedTokenLiquidity));
        // Create a new Project on Greed Starter
        _projectId = _greedStarter.createProject(offeredTokenAddress, paidWith, totalTokens, startingBlock, endsAtBlock, pricePerToken, minimumPurchase, maximumPurchase);
        _pricePerToken = pricePerToken;
        _minimumPurchase = minimumPurchase;
        _maximumPurchase = maximumPurchase;
        _offeredTokenAddress = offeredTokenAddress;
        _initialOfferedTokenLiquidity = initialOfferedTokenLiquidity;
    }

    // TODO: Use the leftovers of the last project, to create a new project.
    function reAttemptProject() external onlyOwner {
        require(_fundsClaimed == false, "Funds were already claimed");
        uint currentOfferedTokensBalance = IERC20(address(this)).balanceOf(address(this));
        require(_initialOfferedTokenLiquidity < currentOfferedTokensBalance , "Not enough offered tokens");
        uint remainingTokens = currentOfferedTokensBalance - _initialOfferedTokenLiquidity;
        // TODO: Requires that the _projectId != 0 and has ended.
        // TODO: Check balance remaining by subtracting the _initialOfferedTokenLiquidity
        // TODO: Create another project with the remaining funds.
    }

    // TODO: claim the collected funds, providing the _initialOfferedTokenLiquidity and the _paidWithTokenAddress as liquidity
    function claimFundsAndProvideLiquidity() external onlyOwner {
        // TODO: Requires that the _projectId != 0 and has ended.
        require(_fundsClaimed == false, "Funds were already claimed");
        _fundsClaimed = true;
    }

}
