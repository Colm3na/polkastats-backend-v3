
// In order to check this backend without a synced local substrate-node container use:
//const DEFAULT_WS_PROVIDER_URL = 'wss://kusama-rpc.polkadot.io';
const DEFAULT_WS_PROVIDER_URL = 'ws://substrate-node:9944';

module.exports = {
  wsProviderUrl: process.env.WS_PROVIDER_URL || DEFAULT_WS_PROVIDER_URL,

  postgresConnParams: {
    user: 'polkastats',
    host: 'postgres',
    database: 'polkastats',
    password: 'polkastats',
    port: 5432,
  },

  crawlers: [
    {
      enabled: true,
      module: require('./lib/crawlers/blockListener.js'),
    },

    {
      enabled: true,
      module: require('./lib/crawlers/blockHarvester.js'),
      config: {
        pollingTime: 1 * 60 * 1000,
      },
    },

    {
      enabled: true,
      module: require('./lib/crawlers/staking.js'),
    },

    {
      enabled: true,
      module: require('./lib/crawlers/activeAccounts.js'),
      config: {
        pollingTime: 10 * 60 * 1000,
      },
    },

    {
      enabled: true,
      module: require('./lib/crawlers/rewards.js'),
    },

    {
      enabled: false,
      module: require('./lib/crawlers/phragmen.js'),
      config: {
        wsProviderUrl: process.env.WS_PROVIDER_URL || DEFAULT_WS_PROVIDER_URL,
        pollingTime: 5 * 60 * 1000,
        phragmenOutputDir: '/tmp/phragmen',
        offlinePhragmenPath: '/usr/app/polkastats-backend-v3/offline-phragmen',
      },
    },
  ],
};
