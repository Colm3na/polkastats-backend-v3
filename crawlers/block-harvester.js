//
// PolkaStats backend v3
//
// This crawler fill gaps in block and events tables
//
// Usage: node block-harvester.js
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

const { shortHash } = require('../lib/utils.js');

let addedBlocks = 0;

// Database connection
const pool = new Pool(postgresConnParams);

async function main () {

  // Start execution
  const startTime = new Date().getTime();

  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // Get gaps from block table
  let sqlSelect = `
    SELECT gap_start, gap_end FROM (
        SELECT block_number + 1 AS gap_start,
        next_nr - 1 AS gap_end
        FROM (
          SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
          FROM block
        ) nr
        WHERE nr.block_number + 1 <> nr.next_nr
      ) AS g
    UNION ALL (
      SELECT
        0 AS gap_start,
        block_number AS gap_end
      FROM
        block
      ORDER BY
        block_number
      ASC LIMIT 1
    )
    ORDER BY gap_start`;
  const res = await pool.query(sqlSelect);

  for (let i = 0; i < res.rows.length; i++) {
    // Quick fix for gap 0-0 error
    if (!(res.rows[i].gap_start == 0 && res.rows[i].gap_end == 0)) {
      console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mDetected gap! Harvest blocks from #${res.rows[i].gap_start} to #${res.rows[i].gap_end}\x1b[0m`);
      await harvestBlocks(api, parseInt(res.rows[i].gap_start), parseInt(res.rows[i].gap_end));
    }
  }
  await pool.end();
  provider.disconnect();

  // Execution end time
  const endTime = new Date().getTime();

  // 
  // Log execution time
  //
  console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mAdded ${addedBlocks} blocks in ${((endTime - startTime) / 1000).toFixed(0)}s\x1b[0m`);
}

async function harvestBlocks(api, startBlock, endBlock) {

  while (startBlock <= endBlock) {

    // Start execution
    const startTime = new Date().getTime();

    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(startBlock);

    // Get extended block header
    const extendedHeader = await api.derive.chain.getHeader(blockHash);

    // Get block parent hash
    const parentHash = extendedHeader.parentHash;
    
    // Get block extrinsics root
    const extrinsicsRoot = extendedHeader.extrinsicsRoot;

    // Get block state root
    const stateRoot = extendedHeader.stateRoot;

    // Get block events
    const blockEvents = await api.query.system.events.at(blockHash);

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
          '${startBlock}',
          '${index}',
          '${event.section}',
          '${event.method}',
          '${phase.toString()}',
          '${JSON.stringify(event.data)}'
        );`;
      try {
        await pool.query(sqlInsert);
        console.log(`[PolkaStats backend v3] - Block harvester - \x1b[33mAdding event #${startBlock}-${index} ${event.section} => ${event.method}\x1b[0m`);
      } catch (error) {
        console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError adding event #${startBlock}-${index}: ${error.error}\x1b[0m`);
      }
    });

    // Get session info for the block
    const currentIndex = await api.query.session.currentIndex.at(blockHash);
    const currentSlot = await api.query.babe.currentSlot.at(blockHash);
    const epochIndex = await api.query.babe.epochIndex.at(blockHash);
    const genesisSlot = await api.query.babe.genesisSlot.at(blockHash);
    const currentEraStartSessionIndex = await api.query.staking.currentEraStartSessionIndex.at(blockHash);
    const currentEra = await api.query.staking.currentEra.at(blockHash);
    const validatorCount = await api.query.staking.validatorCount.at(blockHash);

    const epochDuration = api.consts.babe.epochDuration;
    const sessionsPerEra = api.consts.staking.sessionsPerEra;
    const eraLength = epochDuration.mul(sessionsPerEra);

    const epochStartSlot = epochIndex.mul(epochDuration).add(genesisSlot);
    const sessionProgress = currentSlot.sub(epochStartSlot);
    const eraProgress = currentIndex.sub(currentEraStartSessionIndex).mul(epochDuration).add(sessionProgress);
    
    // Get block author
    const blockAuthor = extendedHeader.author;

    // Get block author identity display name
    const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
    const blockAuthorName = blockAuthorIdentity.identity.display || ``;

    // Get runtime spec name and version
    const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);

    // TODO: Get timestamp from block
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
        '${startBlock}',
        '${blockAuthor}',
        '${blockAuthorName}',
        '${blockHash}',
        '${parentHash}',
        '${extrinsicsRoot}',
        '${stateRoot}',
        '${currentEra}',
        '${currentIndex}',
        '${eraLength}',
        '${eraProgress}',
        'true',
        '${epochDuration}',
        '${sessionsPerEra}',
        '${sessionProgress}',
        '${validatorCount}',
        '${runtimeVersion.specName}',
        '${runtimeVersion.specVersion}',
        '${timestamp}'
      )`;
    try {
      await pool.query(sqlInsert);
      const endTime = new Date().getTime();
      console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mAdded block #${startBlock} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s\x1b[0m`);
    } catch (error) {
      console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError adding block #${startBlock}: ${error.error}\x1b[0m`);
    }
    startBlock++;
    addedBlocks++;
  }
  return true;
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});

