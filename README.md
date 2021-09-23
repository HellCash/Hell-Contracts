# Hell Contracts

Hell Contracts are a set of Ethereum Smart contracts that provide Hell with all the monetary functionalities it has to offer.

Before getting started with this repo, you might want to take a look at our docs in order to have a general notion of how Hell works.

https://docs.hell.cash

# Testing

Tests are located inside the /test folder and can be executed with ease by using the following command within its root directory. 

```
npx hardhat test --network hardhat
```

Keep in mind that you'll have to install its dependencies with npm and also to compile our contracts.

```
git clone https://github.com/jccrlz/HellContracts
cd HellContracts
npm install
npx hardhat compile
```

# Audits 

Though we heavily tested our contracts to ensure they are secure, we haven't been audited yet from any reputable source, so manage your risks accordingly until this gets addressed.

# Licensing

The primary license for HELL Core smart contracts is the Business Source License 1.1 (BUSL-1.1), see LICENSE.

## Exceptions

- All files on ```contracts/external``` were created for testing purposes and are licensed under ```MIT```
- All files on ```contracts/libraries``` are licensed under ```BSD 3-Clause```

# Discussion

For non critical concerns, open an issue or visit us on [Discord](https://discord.com/invite/M9tv2pvhNs) to discuss.

For security concerns, please email <contact@hell.cash>
