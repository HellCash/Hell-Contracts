import {auctionHouseTests} from "./auctionHouse/@auctionHouseTests";
import {greedStarterTests} from "./greedStarter/@greedStarterTests";
import {hellTests} from "./hell/@hellTests";
import {auctionHouseIndexerTests} from "./auctionHouseIndexer/@auctionHouseIndexerTests";
import {greedStarterIndexerTests} from "./greedStarterIndexer/@greedStarterIndexerTests";
import {initializedImplementations} from "./_general/initializedImplementations.test";

describe('[Hell]', hellTests);
describe('[Auction House]', auctionHouseTests);
describe('[Auction House Indexer]', auctionHouseIndexerTests);
describe('[Greed Starter]', greedStarterTests);
describe('[Greed Starter Indexer]', greedStarterIndexerTests);
describe('[General]', initializedImplementations);
