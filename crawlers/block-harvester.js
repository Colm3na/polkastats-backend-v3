//
// PolkaStats backend v3
//
// This crawler fill gaps in block database
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

const { formatNumber, shortHash } = require('../lib/utils.js');

async function main () {

  // Start execution
  const startTime = new Date().getTime();

  // Database connection
  const pool = new Pool(postgresConnParams);

  // Get gaps from block table
  let sqlSelect = `
    SELECT
      gap_start, gap_end FROM (
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
    console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mDetected gap! Harvest blocks from #${res.rows[i].gap_start} to #${res.rows[i].gap_end}\x1b[0m`);
    await harvestBlocks(res.rows[i].gap_start, res.rows[i].gap_end);
  }

  await pool.end();

  // Execution end time
  const endTime = new Date().getTime();

  // 
  // Log execution time
  //
  console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mTotal execution time: ${((endTime - startTime) / 1000).toFixed(0)}s\x1b[0m`);
}

async function getBlockEvents(blockHash) {
  const provider = new WsProvider(wsProviderUrl);
  const api = await ApiPromise.create({ provider });
  const events = await api.query.system.events.at(blockHash);
  provider.disconnect();
  return events;
}

async function harvestBlocks(startBlock, endBlock) {

  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // Database connection
  const pool = new Pool(postgresConnParams);

  while (startBlock <= endBlock) {

    // Start execution
    const startTime = new Date().getTime();

    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(startBlock);

    // Get extended block header
    const extendedHeader = await api.derive.chain.getHeader(blockHash);
    // console.log(JSON.stringify(extendedHeader, null, 2));

    // Get block parent hash
    const parentHash = extendedHeader.parentHash;
    
    // Get block extrinsics root
    const extrinsicsRoot = extendedHeader.extrinsicsRoot;

    // Get block state root
    const stateRoot = extendedHeader.stateRoot;

    // Get block events
    // const blockEvents = await getBlockEvents(blockHash);

    // // Loop through the Vec<EventRecord>
    // blockEvents.forEach( async (record, index) => {
    //   // Extract the phase and event
    //   const { event, phase } = record;
    //   // Output event data
    //   console.log(`index: ${index}, section: ${event.section}, method: ${event.method}, phase: ${phase.toString()}, documentation: ${event.meta.documentation.toString()}, data: ${JSON.stringify(event.data)}`);
    // });

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
    const runtimeVersion = await api.rpc.state.getRuntimeVersion.at(blockHash);

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
      const res = await pool.query(sqlInsert);
      const endTime = new Date().getTime();
      console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mAdded block #${formatNumber(startBlock)} [${shortHash(blockHash)}] in ${((endTime - startTime) / 1000).toFixed(3)}s\x1b[0m`);
    } catch (err) {
      console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError adding block #${formatNumber(startBlock)}: ${err.stack}\x1b[0m`);
    }
    startBlock++;
  }
  await pool.end();
  provider.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});

