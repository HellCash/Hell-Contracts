import {network} from "hardhat";

export class NetworkUtils {
    public static async mineBlocks(numberOfBlocks: Number) {
        for(let i = 0; i < numberOfBlocks; i++) {
            await network.provider.send("evm_mine");
        }
    }

}