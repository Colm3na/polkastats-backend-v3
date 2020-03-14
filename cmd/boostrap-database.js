const { Client } = require('pg');
const fs = require('fs');

const config = require('../backend.config');

const BOOTSTRAP_SQL_FILE =
  process.env.BOOTSTRAP_SQL_FILE ||
  'docker/polkastats-backend/sql/polkastats.sql';

async function main() {
  const sql = fs.readFileSync(BOOTSTRAP_SQL_FILE);

  const client = new Client(config.postgresConnParams);
  await client.connect();
  await client.query(sql.toString());

  client.end();
}

main().catch(err => console.error(err));
