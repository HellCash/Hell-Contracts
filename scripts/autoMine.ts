import {ContractTestHelpers} from "../helpers/ContractTestHelpers";

async function main() {
    await ContractTestHelpers.mineBlocks(99999999999);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });