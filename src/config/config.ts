import { IModule } from './../types/type';
import dotenv from 'dotenv'

dotenv.config()

export const substrateNetwork:string = process.env.SUBSTRATE_NETWORK || 'polkadot'

export const wsProviderUrl:string = process.env.WS_PROVIDER_URL || 'wss://testnet2.uniquenetwork.io'

export const postgresConnParams:any = {
  user: process.env.POSTGRES_USER || 'polkastats',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || 'polkastats',
  password: process.env.POSTGRES_PASSWORD || 'polkastats',
  port: process.env.POSTGRES_PORT || 5432,
}

export const crawlers: Array<IModule> = [
  {
    enabled: !process.env.CRAWLER_SYSTEM_DISABLE,
    module: './crawlers/system'
  },
  {
    enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
    module:  './crawlers/blockListener',
  },
  {
    enabled: !process.env.CRAWLER_BLOCK_HARVESTER_DISABLE,
    module: './crawlers/blockHarvester',
    config: {
        pollingTime: process.env.CRAWLER_BLOCK_LISTENER_POLLING_TIME_MS|| 1 * 60 * 1000,
      },
  },
  {
    enabled: !process.env.CRAWLER_STAKING_DISABLE,
    module: require('./crawlers/staking'),
  },
  {
    enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
    module: require('./crawlers/activeAccounts'),
    config: {
      pollingTime: process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS || 60 * 60 * 1000,
    },
  },
  {
    enabled: !process.env.CRAWLER_CHAIN_DISABLE,
    module: require('./crawlers/chain'),
  },

  {
    enabled: !process.env.CRAWLER_ERA_LISTENER_DISABLE,
    module: require('./crawlers/eraListener'),
  },

  {
    enabled: !process.env.CRAWLER_ERA_HARVESTER_DISABLE,
    module: require('./crawlers/eraHarvester'),
  },

  {
    enabled: !process.env.CRAWLER_PHRAGMEN_DISABLE,
    module: require('./crawlers/phragmen'),
    config: {
      substrateNetwork: process.env.SUBSTRATE_NETWORK || 'polkadot',
      wsProviderUrl: process.env.WS_PROVIDER_URL || 'wss://testnet2.uniquenetwork.io',
      pollingTime: process.env.CRAWLER_PHRAGMEN_POLLING_TIME_MS,
      phragmenOutputDir:
        process.env.CRAWLER_PHRAGMEN_OUTPUT_DIR || '/tmp/phragmen',
      offlinePhragmenPath:
        process.env.CRAWLER_PHRAGMEN_BINARY_PATH ||
        '/usr/app/polkastats-backend-v3/offline-election',
    },
  },
  {      
      enabled: !process.env.CRAWLER_COLLECTION_DISABLE,
      module: require('./crawlers/collectionListener'),
      config: {
        pollingTime: process.env.CRAWLER_COLLECTION_POLLING_TIME_MS || 60 * 60 * 1000
      },      
  }
]