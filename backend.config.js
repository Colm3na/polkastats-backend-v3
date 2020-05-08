require('dotenv').config();

module.exports = {
  wsProviderUrl: process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',

  postgresConnParams: {
    user: process.env.POSTGRES_USER || 'polkastats',
    host: process.env.POSTGRES_HOST || 'postgres',
    database: process.env.POSTGRES_DATABASE || 'polkastats',
    password: process.env.POSTGRES_PASSWORD || 'polkastats',
    port: process.env.POSTGRES_PORT || 5432,
  },

  crawlers: [

    {
      enabled: !process.env.CRAWLER_SYSTEM_DISABLE,
      module: require('./lib/crawlers/system'),
    },
    
    {
      enabled: !process.env.CRAWLER_BLOCK_LISTENER_DISABLE,
      module: require('./lib/crawlers/blockListener'),
    },

    {
      enabled: !process.env.CRAWLER_BLOCK_HARVESTER_DISABLE,
      module: require('./lib/crawlers/blockHarvester'),
      config: {
        pollingTime:
          parseInt(process.env.CRAWLER_BLOCK_LISTENER_POLLING_TIME_MS) ||
          1 * 60 * 1000,
      },
    },

    {
      enabled: !process.env.CRAWLER_STAKING_DISABLE,
      module: require('./lib/crawlers/staking'),
    },

    {
      enabled: !process.env.CRAWLER_ACTIVE_ACCOUNTS_DISABLE,
      module: require('./lib/crawlers/activeAccounts'),
      config: {
        pollingTime:
          parseInt(process.env.CRAWLER_ACTIVE_ACCOUNTS_POLLING_TIME_MS) ||
          60 * 60 * 1000,
      },
    },

    {
      enabled: !process.env.CRAWLER_CHAIN_DISABLE,
      module: require('./lib/crawlers/chain'),
    },

    {
      enabled: !process.env.CRAWLER_REWARDS_DISABLE,
      module: require('./lib/crawlers/rewardsSlashes'),
    },

    {
      enabled: !process.env.CRAWLER_PHRAGMEN_DISABLE,
      module: require('./lib/crawlers/phragmen'),
      config: {
        wsProviderUrl:
          process.env.WS_PROVIDER_URL || 'ws://substrate-node:9944',
        pollingTime: parseInt(process.env.CRAWLER_PHRAGMEN_POLLING_TIME_MS),
        phragmenOutputDir:
          process.env.CRAWLER_PHRAGMEN_OUTPUT_DIR || '/tmp/phragmen',
        offlinePhragmenPath:
          process.env.CRAWLER_PHRAGMEN_BINARY_PATH ||
          '/usr/app/polkastats-backend-v3/offline-phragmen',
      },
    },
  ],
};
