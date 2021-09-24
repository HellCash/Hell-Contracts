import {network} from "hardhat";

export async function txConfirmation(message: string, callData: any, printLogs = true): Promise<boolean> {
    let confirmationBlocks = 1;
    switch (network.name) {
        case 'rinkeby':
        case 'bsctestnet':
        case 'bsc':
        case 'mainnet':
        case 'mumbai':
            confirmationBlocks = 3;
    }
    if (printLogs) {
        console.log(`\t [Confirmations ${confirmationBlocks}] ` + message);
    }
    const tx = await callData;
    const txReceipt = await tx.wait(confirmationBlocks);
    if (txReceipt.status == 1) {
        return true;
    } else {
        console.log('FAILED: ' + message);
        return false;
    }
}

export class NetworkUtils {
    public static async mineBlocks(numberOfBlocks: Number) {
        for(let i = 0; i < numberOfBlocks; i++) {
            await network.provider.send("evm_mine");
        }
    }

}