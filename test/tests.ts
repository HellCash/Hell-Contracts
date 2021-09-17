import {auctionHouseTests} from "./auctionHouse/@auctionHouseTests";
import {greedStarterTests} from "./greedStarter/@greedStarterTests";
import {hellTests} from "./hell/@hellTests";
import {auctionHouseIndexerTests} from "./auctionHouseIndexer/@auctionHouseIndexerTests";
import {greedStarterIndexerTests} from "./greedStarterIndexer/@greedStarterIndexerTests";
import {uupsProxiesImplementations} from "./_general/uupsProxiesImplementations";

describe('[Hell]', hellTests);
describe('[Auction House]', auctionHouseTests);
describe('[Auction House Indexer]', auctionHouseIndexerTests);
describe('[Greed Starter]', greedStarterTests);
describe('[Greed Starter Indexer]', greedStarterIndexerTests);
describe('[UUPS Proxies Implementations]', uupsProxiesImplementations);
