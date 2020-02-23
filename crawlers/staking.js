//
// PolkaStats backend v3
//
// This crawler fetch and store validators and intentions
// staking info on every session change
//
// Usage: node staking.js
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
        const sqlSelect = `SELECT session_index FROM validator_staking ORDER BY session_index DESC LIMIT 1`;
        const res = await pool.query(sqlSelect);
        if (res.rows.length > 0) {
          currentDBIndex = res.rows["session_index"];
          console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mLast session index stored in DB is #${currentDBIndex}\x1b[0m`);
        } else {
          console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mNo session index stored in DB!\x1b[0m`);
        }
      }

       // Get current session index
      const session = await api.derive.session.info();
      currentIndex = parseInt(session.currentIndex.toString());
      console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mCurrent session index is #${currentDBIndex}\x1b[0m`);
      
      if (currentIndex > currentDBIndex) {
        await storeValidatorsStakingInfo(currentIndex);
        await storeIntentionsStakingInfo(currentIndex);

        if (currentDBIndex === 0) {
          currentDBIndex = currentIndex;
        } else {
          currentDBIndex++;
        }
      }

    });

  } else {
    provider.disconnect();
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[31mNode is not synced! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }
}

async function storeValidatorsStakingInfo(currentDBIndex) {
  console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mStoring validators staking info for session #${currentDBIndex}\x1b[0m`);

  // Database connection
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  
  //
  // Initialise the provider to connect to the local polkadot node
  //
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  //
  // Get best block number, active validators, imOnline data, current elected and current era points earned
  //
  const [bestNumber, validators, imOnline, currentElected, currentEraPointsEarned] = await Promise.all([
    api.derive.chain.bestNumber(),
    api.query.session.validators(),
    api.derive.imOnline.receivedHeartbeats(),
    api.query.staking.currentElected(),
    api.query.staking.currentEraPointsEarned()
  ]);

  //
  // Map validator authorityId to staking info object
  //
  const validatorStaking = await Promise.all(
    validators.map(authorityId => api.derive.staking.account(authorityId))
  );

  //
  // Add hex representation of sessionId[] and nextSessionId[]
  //
  validatorStaking.forEach(validator => {
    validator.sessionIdHex = validator.sessionIds.length !== 0 ? validator.sessionIds.toHex() : ``;
    validator.nextSessionIdHex = validator.nextSessionIds.length !== 0 ? validator.nextSessionIds.toHex() : ``;
  })

  //
  // Add imOnline property to validator object
  //
  validatorStaking.forEach(function (validator) {
    if (imOnline[validator.accountId]) {
      validator.imOnline = imOnline[validator.accountId];
    }
  }, imOnline);

  //
  // Add current elected and earned era points to validator object
  //
  for(let i = 0; i < validatorStaking.length; i++) {
    let validator = validatorStaking[i];
    if (Number.isInteger(currentElected.indexOf(validator.accountId))) {
      validator.currentElected = true;
    } else {
      validator.currentElected = false;
    }
    if (currentEraPointsEarned.individual[currentElected.indexOf(validator.accountId)]) {
      validator.currentEraPointsEarned = currentEraPointsEarned.individual[currentElected.indexOf(validator.accountId)];
    }
  }

  if (validatorStaking) {
    // console.log(`validators:`, JSON.stringify(validatorStaking, null, 2));
    var sqlInsert = `INSERT INTO validator_staking (block_number, json, timestamp) VALUES (${bestNumber}', UNIX_TIMESTAMP(), '${JSON.stringify(validatorStaking)});`;
    const res = await pool.query(sqlInsert);
  }
  
  await pool.end();
  provider.disconnect();
}

async function storeIntentionsStakingInfo(currentDBIndex) {
  console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mStoring intentions staking info for session #${currentDBIndex}\x1b[0m`);

  // Database connection
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  
  //
  // Initialise the provider to connect to the local polkadot node
  //
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  //
  // Get best block number
  //
  const bestNumber = await api.derive.chain.bestNumber();

  //
  // Outputs JSON
  //
  console.log(`block_height: ${bestNumber}`);
  
  //
  // Fetch intention validators
  //
  const stakingValidators = await api.query.staking.validators();
  const validators = stakingValidators[0];

  //
  // Map validator authorityId to staking info object
  //
  const validatorStaking = await Promise.all(
    validators.map(authorityId => api.derive.staking.account(authorityId))
  );

  //
  // Add hex representation of sessionId[] and nextSessionId[]
  //
  for(let i = 0; i < validatorStaking.length; i++) {
    let validator = validatorStaking[i];
    if (validator.sessionIds.length > 0) {
      validator.sessionIdHex = validator.sessionIds.toHex();
    }
    if (validator.nextSessionIds.length > 0) {
      validator.nextSessionIdHex = validator.nextSessionIds.toHex();
    }
  }

  if (validatorStaking) {
    var sqlInsert = `INSERT INTO validator_intention (block_number, json, timestamp) VALUES (${bestNumber}', UNIX_TIMESTAMP(), '${JSON.stringify(validatorStaking)});`;
    const res = await pool.query(sqlInsert);
  }

  await pool.end();
  provider.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});



