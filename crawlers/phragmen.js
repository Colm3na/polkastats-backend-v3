// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Postgres lib
const { Pool } = require('pg');

const { spawnSync } = require( 'child_process' );

// Import config params
const {
  wsProviderUrl,
  postgresConnParams
} = require('../backend.config');

const offlinePhragmenPath = `/usr/app/offline-phragmen/offline-phragmen`;

// Database connection
const pool = new Pool(postgresConnParams);

async function main () {

  // Start execution
  const startTime = new Date().getTime();

  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API
  const api = await ApiPromise.create({ provider });

  // Wait for API
  await api.isReady;

  // Wait for node is synced
  let node;
  try {
    node = await api.rpc.system.health();
  } catch {
    provider.disconnect();
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }

  if (node.isSyncing.eq(false)) {

    // Node is synced!
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[33mNode is synced! Starting crawler...\x1b[0m`);

    //
    // Get validator count and minumum validator count
    //
    const [blockHeight, validatorCount, minimumValidatorCount] = await Promise.all([
      api.derive.chain.bestNumber(),
      api.query.staking.validatorCount(),
      api.query.staking.minimumValidatorCount()
    ]);

    const phragmenCmd = spawnSync(`${offlinePhragmenPath}`, [ '-c', validatorCount.toString(), '-m', minimumValidatorCount.toString() ] );
    
    const phragmen = phragmenCmd.stdout.toString();

    if (phragmen) {
      var sqlInsert = `INSERT INTO phragmen (block_height, phragmen_json, timestamp) VALUES ('${blockHeight.toString()}', '${phragmen}', UNIX_TIMESTAMP());`;
      await pool.query(sqlInsert);
    }
    await pool.end();

    //
    // Disconnect from node
    //
    provider.disconnect();

    // Execution end time
    const endTime = new Date().getTime();

    // 
    // Log execution time
    //
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[32mExecution time: ${((endTime - startTime) / 1000).toFixed(0)}s\x1b[0m`);
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[32mNext execution in 5m...\x1b[0m`);
    setTimeout(main, 5 * 60 * 1000);

  } else {
    provider.disconnect();
    console.log(`[PolkaStats backend v3] - Phragmen crawler - \x1b[31mNode is not synced! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});