// SPDX-License-Identifier: BSD 3-Clause
pragma solidity ^0.8.6;

library HellishBlocks {
    function lowerThan(uint blockNumber, uint higherBlock) internal pure returns (bool) {
        return blockNumber < higherBlock;
    }
    function higherThan(uint blockNumber, uint lowerBlock) internal pure returns (bool) {
        return blockNumber > lowerBlock;
    }
    function elapsedOrEqualToCurrentBlock(uint blockNumber) internal view returns (bool) {
        return blockNumber <= block.number;
    }
    function notElapsedOrEqualToCurrentBlock(uint blockNumber) internal view returns (bool) {
        return blockNumber >= block.number;
    }
    function elapsed(uint blockNumber) internal view returns (bool) {
        return blockNumber < block.number;
    }
    function notElapsed(uint blockNumber) internal view returns (bool) {
        return blockNumber > block.number;
    }
}