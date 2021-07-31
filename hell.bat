@echo off
set command=%1
if "%command%"=="deploy" (goto :deploy) else ^
if "%command%"=="upgrade" (goto :upgrade) else ^
if "%command%"=="compile" (goto :compile) else ^
if "%command%"=="size" (goto :size) else ^
if "%command%"=="test" (goto :test) else ^
if "%command%"=="fake" (goto :fake) else ^
echo "You didn't provide a valid command"
goto :exit

:deploy
npx hardhat run --network localhost scripts/deploy.ts
goto :exit

:compile
npx hardhat compile
goto :exit

:size
npx hardhat size-contracts
goto :exit

:test
npx hardhat test
goto :exit

:upgrade
set contractName=%2
if "%contractName%"=="hell" (npx hardhat run --network localhost scripts/upgradeHell.ts) else ^
if "%contractName%"=="hellVault" (npx hardhat run --network localhost scripts/upgradeHellVault.ts) else ^
if "%contractName%"=="greedStarter" (npx hardhat run --network localhost scripts/upgradeGreedStarter.ts) else ^
if "%contractName%"=="upgradeAuctionHouse" (npx hardhat run --network localhost scripts/upgradeAuctionHouse.ts) else ^
echo "You didn't provide a valid contract name"
goto :exit

:fake
npx hardhat run --network localhost scripts/fake/greedStarterCreateProject.ts
goto :exit

:exit
exit /b 0