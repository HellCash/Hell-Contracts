import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import "hardhat-erc1820"; // Hardhat plugin to automatically deploy the ERC-1820 Registry contract.

export default {
  solidity: "0.8.7",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [],
    },
    hardhat: {
      accounts: {
        count: 1000
      }
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
    runOnCompile: false,
    disambiguatePaths: false,
  }
};

