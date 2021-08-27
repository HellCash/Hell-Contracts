@echo off
set command=%1
if "%command%"=="deploy" (goto :deploy) else ^
if "%command%"=="upgrade" (goto :upgrade) else ^
if "%command%"=="compile" (goto :compile) else ^
if "%command%"=="size" (goto :size) else ^
if "%command%"=="test" (goto :test) else ^
if "%command%"=="fake" (goto :fake) else ^
if "%command%"=="deploy-fake" (goto :deploy-fake) else ^
if "%command%"=="deploy-test" (goto :deploy-test) else ^
if "%command%"=="mine" (goto :mine) else ^
if "%command%"=="help" (goto :help) else ^
echo You didn't provide a valid command
goto :exit

:deploy
set networkName=%2
call npx hardhat run --network %networkName% scripts/deployDevelopmentContracts.ts
goto :exit

:deploy-fake
set networkName=%2
call npx hardhat run --network %networkName% scripts/deployDevelopmentContracts.ts
goto :fake

:deploy-test
call npx hardhat run --network localhost scripts/deployLocalContracts.ts
goto :test

:compile
call npx hardhat compile
goto :exit

:size
call npx hardhat size-contracts
goto :exit

:test
call npx hardhat test
goto :exit

:mine
call npx hardhat run --network localhost scripts/autoMine.ts
goto :exit

:help
echo deploy  "Deploy contracts specified on scripts/deploy.ts"
echo deploy-fake  "Deploy contracts and then create test data"
echo deploy-test  "Deploy contracts and then execute tests"
echo mine    "Start auto mining blocks, You'll have to stop this command manually with CTRL + C"
echo upgrade ^<contractName^> "Upgrade the specified contract implementation"
echo compile  "Compile the contracts specified at /contracts"
echo size    "Display the size of the Hell ecosystem contracts"
echo test   "Execute tests defined at /test"
echo fake   "Create test data defined on scripts/fake.ts"
echo help   "Display commands"
goto :exit

:upgrade
set contractName=%2
set networkName=%3
if "%contractName%"=="hell" (npx hardhat run --network %networkName% scripts/upgrades/upgradeHell.ts) else ^
if "%contractName%"=="hellVault" (npx hardhat run --network %networkName% scripts/upgrades/upgradeHellVault.ts) else ^
if "%contractName%"=="greedStarter" (npx hardhat run --network %networkName% scripts/upgrades/upgradeGreedStarter.ts) else ^
if "%contractName%"=="upgradeAuctionHouse" (npx hardhat run --network %networkName% scripts/upgrades/upgradeAuctionHouse.ts) else ^
echo You didn't provide a valid contract name
goto :exit

:fake
call npx hardhat run --network localhost scripts/fake/greedStarterCreateProject.ts
call npx hardhat run --network localhost scripts/fake/auctionHouseCreateAuctions.ts
call npx hardhat run --network localhost scripts/fake/distributeWealth.ts
goto :exit

:exit
exit /b 0