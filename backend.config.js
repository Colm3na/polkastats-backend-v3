module.exports = {
  // Enable CORS
  enableCORS: true,
  // Backend port
  backendPort: 8443,
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
}