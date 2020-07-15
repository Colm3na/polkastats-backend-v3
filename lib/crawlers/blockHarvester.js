// @ts-check
const { BigNumber } = require('bignumber.js');
const { shortHash, storeExtrinsics, getDisplayName } = require('../utils.js');
const pino = require('pino');
const logger = pino();

const loggerOptions = {
  crawler: `blockHarvester`
};

module.exports = {
  start: async function(api, pool, config) {
    logger.info(loggerOptions, `Starting block harvester...`);

    // Start execution
    const startTime = new Date().getTime();

    let addedBlocks = 0;

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
          block_number - 2 AS gap_end
        FROM
          block
        ORDER BY
          block_number
        ASC LIMIT 1
      )
      ORDER BY
        gap_end DESC
    `;
    const res = await pool.query(sqlSelect);
  
    for (let i = 0; i < res.rows.length; i++) {
      // Quick fix for gap 0-0 error
      if (!(res.rows[i].gap_start == 0 && res.rows[i].gap_end == 0)) {
        logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${res.rows[i].gap_end} to #${res.rows[i].gap_start}`);
        await module.exports.harvestBlocks(api, pool, parseInt(res.rows[i].gap_start), parseInt(res.rows[i].gap_end));
      }
    }
  
    // Execution end time
    const endTime = new Date().getTime();
  
    // 
    // Log execution time
    //
    logger.info(loggerOptions, `Added ${addedBlocks} blocks in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in 60m...`);

    setTimeout(
      () => module.exports.start(api, pool, config),
      config.pollingTime,
    );
  },
  harvestBlocks: async function(api, pool, startBlock, endBlock) {
    let addedBlocks = 0;
    while (endBlock >= startBlock) {
      
      // Start execution
      const startTime = new Date().getTime();
      
      // Get block hash
      const blockHash = await api.rpc.chain.getBlockHash(endBlock);

      let block = undefined;
      try {
        block = (await api.rpc.chain.getBlock(blockHash)).block;
      } catch (error) {
        logger.error(loggerOptions, `API error getting block ${endBlock} (${blockHash}): ${error}`);
      }

      if (block) {
        // Parallelize chain queries!
        const [
          { author },
          blockEvents,
          runtimeVersion,
          timestampMs,
          validatorCount,
          ChainCurrentIndex,
          ChainCurrentSlot,
          ChainEpochIndex,
          ChainGenesisSlot,
          ChainCurrentEra
        ] = await Promise.all([
          api.derive.chain.getHeader(blockHash),
          api.query.system.events.at(blockHash),
          api.rpc.state.getRuntimeVersion(blockHash),
          api.query.timestamp.now.at(blockHash),
          api.query.staking.validatorCount.at(blockHash),
          api.query.session.currentIndex.at(blockHash),
          api.query.babe.currentSlot.at(blockHash),
          api.query.babe.epochIndex.at(blockHash),
          api.query.babe.genesisSlot.at(blockHash),
          api.query.staking.currentEra.at(blockHash)
        ]);

        const currentEra = new BigNumber(ChainCurrentEra);

        const [
          erasStartSessionIndex,
          blockAuthorIdentity
        ] = await Promise.all([
          // CAUTION: This only works for the last HISTORY_DEPTH eras (api.query.staking.historyDepth)
          api.query.staking.erasStartSessionIndex(currentEra.toString()),
          api.derive.accounts.info(author)
        ]);

        const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

        // Block timestamp
        const timestamp = Math.floor(timestampMs / 1000);
        
        // Get block parent hash
        const parentHash = block.header.parentHash;
        
        // Get block extrinsics root
        const extrinsicsRoot = block.header.extrinsicsRoot;
        
        // Get block state root
        const stateRoot = block.header.stateRoot;

        // Store block extrinsics
        await storeExtrinsics(pool, endBlock, block.extrinsics, blockEvents, loggerOptions);

        // Get block number finalized
        // TODO: Get finalized from finalitytracker/final_hint extrinsic
        const blockNumberFinalized = 0;

        // Loop through the Vec<EventRecord>
        blockEvents.forEach( async (record, index) => {
          
          // Extract the phase and event
          const { event, phase } = record;
          // console.log(JSON.stringify(record, null, 2));

          const sqlInsert = 
            `INSERT INTO event (
              block_number,
              event_index,
              section,
              method,
              phase,
              data
            ) VALUES (
              '${endBlock}',
              '${index}',
              '${event.section}',
              '${event.method}',
              '${phase.toString()}',
              '${JSON.stringify(event.data)}'
            )
            ON CONFLICT ON CONSTRAINT event_pkey 
            DO NOTHING
            ;`;
          try {
            await pool.query(sqlInsert);
            logger.info(loggerOptions, `Added event #${endBlock}-${index} ${event.section} ➡ ${event.method}`);
          } catch (error) {
            logger.error(loggerOptions, `Error adding event #${endBlock}-${index}: ${error}, sql: ${sqlInsert}`);
          }
        });

        const currentIndex = new BigNumber(ChainCurrentIndex);
        const currentSlot = new BigNumber(ChainCurrentSlot);
        const epochIndex = new BigNumber(ChainEpochIndex);
        const genesisSlot = new BigNumber(ChainGenesisSlot);
        const currentEraStartSessionIndex = new BigNumber(erasStartSessionIndex);

        if (currentEraStartSessionIndex) {
          
          const epochDuration = new BigNumber(api.consts.babe.epochDuration);
          const sessionsPerEra = new BigNumber(api.consts.staking.sessionsPerEra);
          const eraLength = epochDuration.multipliedBy(sessionsPerEra);
          const epochStartSlot = epochIndex.multipliedBy(epochDuration).plus(genesisSlot);
          const sessionProgress = currentSlot.minus(epochStartSlot);

          // We don't calculate eraProgress for harvested blocks
          const eraProgress = 0;

          // Update validator produced_blocks table
          let sql = `SELECT produced_blocks FROM validator WHERE session_index = '${currentIndex}' AND account_id = '${author}'`;
          let res = await pool.query(sql);
          if (res.rows.length > 0) {
            const producedBlocks = parseInt(res.rows[0].produced_blocks) + 1;
            sql = `UPDATE validator SET produced_blocks = '${producedBlocks}' WHERE session_index = '${currentIndex}' AND account_id = '${author}'`;
            try {
              await pool.query(sql);
            } catch (error) {
              logger.error(loggerOptions, `Error updating validator produced_blocks: ${JSON.stringify(error)}`);
            }
          }
            
          // Total events
          const totalEvents = blockEvents.length || 0;

          // Find number of balance transfers in this block
          const numTransfers =
            blockEvents
              .filter( record => (record.event.section === `balances` && record.event.method === `Transfer`))
              .length || 0;

          // Find number of new accounts in this block
          const newAccounts =
            blockEvents
              .filter( record => (record.event.section === `balances` && record.event.method === `Endowed`))
              .length || 0;

          const sqlInsert =
            `INSERT INTO block (
              block_number,
              block_number_finalized,
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
              total_events,
              num_transfers,
              new_accounts,
              timestamp
            ) VALUES (
              '${endBlock}',
              '${blockNumberFinalized}',
              '${author}',
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
              '${totalEvents}',
              '${numTransfers}',
              '${newAccounts}',
              '${timestamp}'
            )
            ON CONFLICT ON CONSTRAINT block_pkey 
            DO NOTHING
            ;`;
          try {
            await pool.query(sqlInsert);
            const endTime = new Date().getTime();
            logger.info(loggerOptions, `Added block #${endBlock} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s`);
          } catch (error) {
            logger.error(loggerOptions, `Error adding block #${endBlock}: ${error.error}`);
          }
          endBlock--;
          addedBlocks++;
        } else {
          logger.info(loggerOptions, `End of history depth reached, stopping!`);
        }
      }
    }
  }
}