//
// PolkaStats backend v3
//
// This crawler fetch and store staking info on every session change
//
// Usage: node staking.js
//
//

// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Postgres lib
const { Pool } = require('pg');

// Import config params
const {
  wsProviderUrl,
  postgresConnParams
} = require('../backend.config');

let currentIndex = 0;
let currentDBIndex = 0;

async function main () {
  
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
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }
  
  if (node.isSyncing.eq(false)) {

    // Node is synced!
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mNode is synced! Starting crawler...\x1b[0m`);

    // Database connection
    const pool = new Pool(postgresConnParams);
    await pool.connect();
    
    // Subscribe to new blocks
    const unsubscribe = await api.rpc.chain.subscribeNewHeads( async (header) => {

      // First execution
      if (currentDBIndex === 0) {
        // Get last index stored in DB
        const sqlSelect = `SELECT session_index FROM staking WHERE 1 ORDER BY session_index DESC LIMIT 1`;
        const res = await pool.query(sqlSelect);
        if (res.rows.length > 0) {
          currentDBIndex = res.rows["session_index"];
          console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mLast session index stored: #${currentDBIndex}\x1b[0m`);
        }
      }

      currentIndex = parseInt(await api.query.session.currentIndex.toString());
      
      if (currentIndex > currentDBIndex) {
        await storeStakingInfo(currentDBIndex);
        currentDBIndex++;
      }

    });

  } else {
    provider.disconnect();
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[31mNode is not synced! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }
}

async function storeStakingInfo(currentDBIndex) {
  console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mStoring staking info for session #${currentDBIndex}\x1b[0m`);

}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});



