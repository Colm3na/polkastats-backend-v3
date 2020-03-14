module.exports = {
  // Local Polkadot Kusama node
  wsProviderUrl: 'ws://substrate-node:9944',
  // Postgres database connection params
  postgresConnParams: {
    user: 'polkastats',
    host: 'postgres',
    database: 'polkastats',
    password: 'polkastats',
    port: 5432,
  },
  BLOCK_HARVESTER_POLLING_TIME: 1 * 60 * 1000, // Run every 10 min
  ACTIVE_ACCOUNTS_POLLING_TIME: 1 * 60 * 1000, // Run every 60 min
  PHRAGMEN_POLLING_TIME: 5 * 60 * 1000, // Run every 5 min

  phragmen: {
    wsProviderUrl: 'ws://substrate-node:9944',
    phragmenOutputDir: '/tmp/phragmen',
    offlinePhragmenPath: '/usr/app/polkastats-backend-v3/offline-phragmen',
  },
};
