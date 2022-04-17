import 'dotenv/config';
import { Sequelize } from 'sequelize/types';
import { start as systemStart } from '../crawlers/system';
import { start as repairDataFromBlocksStart  } from '../crawlers/repairDataFromBlocks';
import { start as blockListenerStart } from '../crawlers/blockListener';
import { start as activeAccountsStart  } from '../crawlers/activeAccounts';
import { start as chainStart } from '../crawlers/chain';
import { start as collectionListenerStart } from '../crawlers/collectionListener';
import { start as tokenListenerStart} from '../crawlers/tokenListener';
import { start as oldBlockListenerStart } from '../crawlers/oldBlockListener';

function getConnect() {
  const user =  process.env.POSTGRES_USER || 'polkastats';
  const password = process.env.POSTGRES_PASSWORD || 'polkastats';
  const database = process.env.POSTGRES_DATABASE || 'polkastats';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || 5432;
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

export const substrateNetwork = process.env.SUBSTRATE_NETWORK || 'polkadot';
export const wsProviderUrl = process.env.WS_PROVIDER_URL || 'wss://testnet2.uniquenetwork.io';
export const typeProvider = process.env.TYPE_PROVIDER || 'testnet2';
export const dbConnect = getConnect();

export const prometheusPort = process.env.PROMETHEUS_PORT || 9003;

export const firstBlock = process.env.FIRST_BLOCK || 0;

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

export interface ICrawlerModuleConfig {
  pollingTime: number;
}

interface ICrawlerModuleConstructorArgs {
  api: any;
  sequelize: Sequelize;
  config: ICrawlerModuleConfig;
}

export interface ICrawlerModule {
  enabled: boolean;
  start: (args: ICrawlerModuleConstructorArgs) => Promise<void>;
  config?: ICrawlerModuleConfig;
}

export const crawlers: ICrawlerModule[] = [
  {
    enabled: !process.env.CRAWLER_SYSTEM_DISABLE,
    start: systemStart,
  },
  {
    enabled: !process.env.CRAWLER_REPAIR_DATA_FROM_BLOCKS_DISABLE,
    start: repairDataFromBlocksStart,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_REPAIR_DATA_FROM_BLOCKS_POLLING_TIME_MS) ||
        DEFAULT_POLLING_TIME_MS,
    },
  },
  {
    enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
    start: blockListenerStart,
  },
  {
    enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
    start: activeAccountsStart,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS) ||
        DEFAULT_POLLING_TIME_MS,
    },
  },
  {
    enabled: !process.env.CRAWLER_CHAIN_DISABLE,
    start: chainStart,
  },
  {
    enabled: !process.env.CRAWLER_COLLECTION_DISABLE,
    start: collectionListenerStart,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_COLLECTION_POLLING_TIME_MS) ||
        DEFAULT_POLLING_TIME_MS,
    },
  },
  {
    enabled: !process.env.CRAWLER_TOKEN_DISABLE,
    start: tokenListenerStart,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_TOKEN_POLLING_TIME_MS) ||
        DEFAULT_POLLING_TIME_MS,
    },
  },
  {
    enabled: !process.env.CRAWLER_OLD_BLOCK_LISTENER_DISABLE,
    start: oldBlockListenerStart,
  },
];
