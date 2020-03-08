module.exports = {
  // Enable CORS
  enableCORS: true,
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
  BLOCK_HARVESTER_POLLING_TIME: 10 * 60 * 1000, // Run every 10 min
  ACTIVE_ACCOUNTS_POLLING_TIME: 60 * 60 * 1000 // Run every 60 min
}
