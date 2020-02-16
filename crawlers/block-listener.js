//
// PolkaStats backend v3
//
// This crawler listen to new blocks and add them to database
//
// Usage: node block-listener.js
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

// Database connection
const pool = new Pool(postgresConnParams);

const { formatNumber, shortHash } = require('../lib/utils.js');

async function main () {
  
  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });
  
  // Subscribe to new blocks
  const unsubscribe = await api.rpc.chain.subscribeNewHeads( async (header) => {

    // Get block number
    const blockNumber = header.number.toNumber();

    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

    // Get extended block header
    const extendedHeader = await api.derive.chain.getHeader(blockHash);

    // Get block parent hash
    const parentHash = header.parentHash;
    
    // Get block extrinsics root
    const extrinsicsRoot = header.extrinsicsRoot;

    // Get block state root
    const stateRoot = header.stateRoot;

    // Get block events
    const blockEvents = await getBlockEvents(blockHash);

    // Loop through the Vec<EventRecord>
    blockEvents.forEach( async (record, index) => {
      // Extract the phase and event
      const { event, phase } = record;
  
      //
      //  TODO: Update counters in block table:
      //
      //  total_extrinsics
      //  total_signed_extrinsics
      //  total_failed_extrinsics
      //  total_events
      //  total_system_events
      //  total_module_events
      //  new_accounts
      //  reaped_accounts
      //  new_contracts
      //  new_sessions
      //
  
      const sqlInsert = 
        `INSERT INTO event (
          block_number,
          event_index,
          section,
          method,
          phase,
          data
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${event.section}',
          '${event.method}',
          '${phase.toString()}',
          '${JSON.stringify(event.data)}'
        );`;
      try {
        await pool.query(sqlInsert);
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[31mAdding event #${blockNumber}-${index} ${event.section} => ${event.method}\x1b[0m`);
  
      } catch (err) {
        console.log(`SQL: ${sqlInsert}`);
        console.log(`ERROR: ${err}`);
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[31mError adding event #${blockNumber}-${index}\x1b[0m`);
      }
    });    

    // Get block author
    const blockAuthor = extendedHeader.author;

    // Get block author identity display name
    const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
    const blockAuthorName = blockAuthorIdentity.identity.display || ``;

    // Get runtime spec name and version
    const runtimeVersion = await api.rpc.state.getRuntimeVersion();

    // Get session info
    const session = await api.derive.session.info();

    // Handle chain reorganizations
    const sqlSelect = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      // Chain reorganization detected! We need to update block_author, block_hash and state_root
      console.log(`[PolkaStats backend v3] - Block listener - \x1b[33mDetected chain reorganization at block #${formatNumber(blockNumber)}, updating author, author name, hash and state root\x1b[0m`);

      // Get block author
      const blockAuthor = extendedHeader.author;

      // Get block author identity display name
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
      const blockAuthorName = blockAuthorIdentity.identity.display || ``;

      const sqlUpdate =
        `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
      const res = await pool.query(sqlUpdate);

    } else {
      console.log(`[PolkaStats backend v3] - Block listener - \x1b[32mAdding block #${formatNumber(blockNumber)} [${shortHash(blockHash)}]\x1b[0m`);
      const timestamp = new Date().getTime();
      const sqlInsert =
        `INSERT INTO block (
          block_number,
          block_author,
          block_author_name,
          block_hash,
          parent_hash,
          extrinsics_root,
          state_root,
          current_era,
          current_index,
          era_length,
          era_progress,
          is_epoch,
          session_length,
          session_per_era,
          session_progress,
          validator_count,
          spec_name,
          spec_version,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${blockAuthor}',
          '${blockAuthorName}',
          '${blockHash}',
          '${parentHash}',
          '${extrinsicsRoot}',
          '${stateRoot}',
          '${session.currentEra}',
          '${session.currentIndex}',
          '${session.eraLength}',
          '${session.eraProgress}',
          '${session.isEpoch}',
          '${session.sessionLength}',
          '${session.sessionsPerEra}',
          '${session.sessionProgress}',
          '${session.validatorCount}',
          '${runtimeVersion.specName}',
          '${runtimeVersion.specVersion}',
          '${timestamp}'
        )`;
      const res = await pool.query(sqlInsert);
    }
  });
  // We connect/disconnect in each loop to avoid problems if database server is restarted while crawler is running
  await pool.end();
}

async function getBlockEvents(blockHash) {
  const provider = new WsProvider(wsProviderUrl);
  const api = await ApiPromise.create({ provider });
  const events = await api.query.system.events.at(blockHash);
  provider.disconnect();
  return events;
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});

