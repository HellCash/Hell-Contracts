import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import 'hardhat-contract-sizer';
import 'hardhat-deploy';

export default {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        count: 1000
      }
    },
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
    timeout: 30000000
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  }
};

