import {deployContracts} from "./deployContracts";
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
async function main() {
  await deployContracts();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });