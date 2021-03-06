import {auctionHouseTests} from "./auctionHouse/@auctionHouseTests";
import {greedStarterTests} from "./greedStarter/@greedStarterTests";
import {hellTests} from "./hell/@hellTests";
import {auctionHouseIndexerTests} from "./auctionHouseIndexer/@auctionHouseIndexerTests";
import {greedStarterIndexerTests} from "./greedStarterIndexer/@greedStarterIndexerTests";
import {uupsProxiesImplementations} from "./_general/uupsProxiesImplementations";
import {hellGovernmentTests} from "./hellGovernment/@hellGovernmentTests";

describe('[Hell]', hellTests);
describe('[Hell Government]', hellGovernmentTests);
describe('[Auction House]', auctionHouseTests);
describe('[Auction House Indexer]', auctionHouseIndexerTests);
describe('[Greed Starter]', greedStarterTests);
describe('[Greed Starter Indexer]', greedStarterIndexerTests);
describe('[UUPS Proxies Implementations]', uupsProxiesImplementations);
