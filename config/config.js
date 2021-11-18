require('dotenv').config()


function getConnect() {
  const user =  process.env.POSTGRES_USER || 'polkastats';
  const password = process.env.POSTGRES_PASSWORD || 'polkastats';
  const database = process.env.POSTGRES_DATABASE || 'polkastats';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || 5432;
  return `postgres://${user}:${password}@${host}:${port}/${database}`;
}

module.exports.substrateNetwork = process.env.SUBSTRATE_NETWORK || 'polkadot';
module.exports.wsProviderUrl = process.env.WS_PROVIDER_URL || 'wss://testnet2.uniquenetwork.io';
module.exports.typeProvider = process.env.TYPE_PROVIDER || 'testnet2';
module.exports.dbConnect = getConnect();

module.exports.crawlers = [
  {
    enabled: !process.env.CRAWLER_SYSTEM_DISABLE,    
    module: `${process.cwd()}/crawlers/system.js`,
  },
  
  {
    enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
    module: `${process.cwd()}/crawlers/blockListener.js`,
  },

  // {
  //   enabled: !process.env.CRAWLER_BLOCK_HARVESTER_DISABLE,
  //   module: '/lib/crawlers/blockHarvester.js',
  //   config: {
  //     pollingTime:
  //       parseInt(process.env.CRAWLER_BLOCK_LISTENER_POLLING_TIME_MS) ||
  //       1 * 60 * 1000,
  //   },
  // },
  // {
  //   enabled: !process.env.CRAWLER_STAKING_DISABLE,
  //   module: '/lib/crawlers/staking.js',
  // },
  {
    enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
    module: `${process.cwd()}/crawlers/activeAccounts.js`,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS) ||
        60 * 60 * 1000,
    },
  },
  {
    enabled: !process.env.CRAWLER_CHAIN_DISABLE,
    module: `${process.cwd()}/crawlers/chain.js`,
  },

  // {
  //   enabled: !process.env.CRAWLER_ERA_LISTENER_DISABLE,
  //   module: '/lib/crawlers/eraListener.js',
  // },

  // {
  //   enabled: !process.env.CRAWLER_ERA_HARVESTER_DISABLE,
  //   module: '/lib/crawlers/eraHarvester.js',
  // },

  // {
  //   enabled: !process.env.CRAWLER_PHRAGMEN_DISABLE,
  //   module: '/lib/crawlers/phragmen.js',
  //   config: {
  //     substrateNetwork: process.env.SUBSTRATE_NETWORK || 'polkadot',
  //     wsProviderUrl: process.env.WS_PROVIDER_URL || 'wss://testnet2.uniquenetwork.io',
  //     pollingTime: parseInt(process.env.CRAWLER_PHRAGMEN_POLLING_TIME_MS),
  //     phragmenOutputDir:
  //       process.env.CRAWLER_PHRAGMEN_OUTPUT_DIR || '/tmp/phragmen',
  //     offlinePhragmenPath:
  //       process.env.CRAWLER_PHRAGMEN_BINARY_PATH ||
  //       '/usr/app/polkastats-backend-v3/offline-election',
  //   },
  // },
  {      
      enabled: !process.env.CRAWLER_COLLECTION_DISABLE,
      module: `${process.cwd()}/crawlers/collectionListener.js`,
      config: {
        pollingTime:
          parseInt(process.env.CRAWLER_COLLECTION_POLLING_TIME_MS) ||
          60 * 60 * 1000,
      },      
  },
  {      
    enabled: !process.env.CRAWLER_TOKEN_DISABLE,
    module: `${process.cwd()}/crawlers/tokenListener.js`,
    config: {
      pollingTime:
        parseInt(process.env.CRAWLER_TOKEN_POLLING_TIME_MS) ||
        60 * 60 * 1000,
    },      
  },
  {
    enabled: !process.env.CRAWLER_OLD_BLOCK_LISTENER_DISABLE,
    module: `${process.cwd()}/crawlers/oldBlockListener.js`    
  }
]