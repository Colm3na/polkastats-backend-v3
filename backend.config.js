// Also wss://kusama-rpc.polkadot.io
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

  staking: {
    enabled: true,
  },

  rewards: {
    enabled: true,
  },

  blockListener: {
    enabled: true,
  },

  blockHarvester: {
    enabled: true,
    pollingTime: 1 * 60 * 1000,
  },

  accounts: {
    enabled: true,
    pollingTime: 1 * 60 * 1000,
  },

  phragmen: {
    enabled: true,
    pollingTime: 5 * 60 * 1000,
    phragmenOutputDir: '/tmp/phragmen',
    offlinePhragmenPath: '/usr/app/polkastats-backend-v3/offline-phragmen',
  },
};
