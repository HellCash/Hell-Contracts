import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import "hardhat-erc1820"; // Hardhat plugin to automatically deploy the ERC-1820 Registry contract.

export default {
  solidity: "0.8.6",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      forking: "https://bsc-dataseed.binance.org",
      url: "http://127.0.0.1:8545",
      gas: "auto",
      gasPrice: 20000000000,
      timeout: 1200000,
      allowUnlimitedContractSize: true,
      accounts: [
          "16b3e176c000287328b09c6495e5e43d9239ab07665ae3720c5533fd238cf725",
          "826283c86d191c2310414e9fe2e7778b08f35a88935cb000cbea87142ffd2126",
          "03be9e5a92a51582fe0b5a49cacd7fcc78aad5efad1aecb4dc8926a413514375",
          "3d2377cc1a1299a9714fa0dbb3e38d2fdea7304d366607ce8cf4809c8503ddfb",
          "ddc470edf50b955ef180eb3c3833ad002535c24a3e3db96576479b21c578f0a9",
          "775dab3c200be02bde2f0fca72193c9c65e02aa37bcc0f4154c5f46c4bae4d96",
          "10695433a34e384075416dd8924f99302435761530db9b9269f99936754db907",
          "cd1eef477ee61081c0a86224a782398325c93b1a075989e17b538eadecfbf2e7",
          "2cba7e1f84536b081949fb265fa9aa3944f71e22a3ca82d9e365050aa92e6704",
          "02034fe65df654f9bf5d684bd98741b7811335fbcb9ddfc90afb0b9d3bffd28a",
          "3cc7a2586d813d69eab0de1d22e326c732dc9c9f75b030756f3c0377e1406fae",
      ],
    },
    ganacheCli: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c",
        "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913",
        "0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743",
      ],
    },
    hardhat: {
      // forking: {
      //   url: "https://bsc-dataseed.binance.org",
      // },
      // mining: {
      //   auto: false,
      //   interval: 3000,
      // },
      saveDeployments: true,
      throwOnCallFailures: true,
      accounts: [
        {
          privateKey: "09743f8a3f0029947a3f0d3dc73157968cfb722b236cd7e2decf691ced6260eb",
          balance: "20000000000000000000000",
        },
        {
          privateKey: "b2679be83eee698526476fe61f503fbb585a51ce8e56ad4ac24e14afd31a5207",
          balance: "10000000000000000000000",
        },
        {
          privateKey: "3d138a185c15187f0cd06cab6f5f53142802d3a4ba311f87eb559c56830072bc",
          balance: "10000000000000000000000",
        },
        {
          privateKey: "7e5b9072b70a2fb65062d634fba06327365a2f455e7f885dc9884f7750cc6d93",
          balance: "10000000000000000000000",
        },
        {
          privateKey: "16a97ded8eb0b81aa3d5f46ed34db4c34ba6db5d756bb5b876c167488e0285d8",
          balance: "10000000000000000000000",
        },
      ],
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      gasLimit: 100000000,
      accounts: ["e0948280928e4abfa1fc38a872496bab0ab48a51fb7077b12c455819dec64e0b"],
    },
    mainnet: {
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
    artifacts: "./../artifacts"
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

