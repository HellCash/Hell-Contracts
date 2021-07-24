import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
// import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import "hardhat-erc1820"; // Hardhat plugin to automatically deploy the ERC-1820 Registry contract.

export default {
  solidity: "0.8.6",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: "auto",
      gasPrice: 20000000000,
      timeout: 1200000,
      allowUnlimitedContractSize: true,
      accounts: [],
    },
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      gasLimit: 100000000,
      accounts: [],
    },
    bsc_mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      // accounts: {mnemonic: mnemonic}
    }
  },
  settings: {
    optimizer: {
      enabled: true
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 300000
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }
};

