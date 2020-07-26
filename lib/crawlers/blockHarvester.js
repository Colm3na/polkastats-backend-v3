// @ts-check
const { BigNumber } = require('bignumber.js');
const { shortHash, storeExtrinsics, storeLogs, getDisplayName, updateTotals } = require('../utils.js');
const pino = require('pino');
const logger = pino();

const loggerOptions = {
  crawler: `blockHarvester`
};

module.exports = {
  start: async function(api, pool, config) {
    logger.info(loggerOptions, `Starting block harvester...`);
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
  
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${addedBlocks} blocks in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in 60m...`);

    setTimeout(
      () => module.exports.start(api, pool, config),
      config.pollingTime,
    );
  },
  harvestBlocks: async function(api, pool, startBlock, endBlock) {
    while (endBlock >= startBlock) {
      const startTime = new Date().getTime();
      try {
        const blockHash = await api.rpc.chain.getBlockHash(endBlock);
        const [
          blockHeader,
          runtimeVersion,
          timestampMs,
          validatorCount,
          ChainCurrentIndex,
          ChainCurrentSlot,
          ChainEpochIndex,
          ChainGenesisSlot,
          ChainCurrentEra,
          eraElectionStatus
        ] = await Promise.all([
          api.derive.chain.getHeader(blockHash),
          api.rpc.state.getRuntimeVersion(blockHash),
          api.query.timestamp.now.at(blockHash),
          api.query.staking.validatorCount.at(blockHash),
          api.query.session.currentIndex.at(blockHash),
          api.query.babe.currentSlot.at(blockHash),
          api.query.babe.epochIndex.at(blockHash),
          api.query.babe.genesisSlot.at(blockHash),
          api.query.staking.currentEra.at(blockHash),
          api.query.staking.eraElectionStatus.at(blockHash)
        ]);

        const currentEra = new BigNumber(ChainCurrentEra);
        const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
        const timestamp = Math.floor(timestampMs / 1000);
        const parentHash = blockHeader.parentHash;
        const extrinsicsRoot = blockHeader.extrinsicsRoot;
        const stateRoot = blockHeader.stateRoot;

        // Store block logs
        await storeLogs(pool, endBlock, blockHeader.digest.logs, loggerOptions);
    
        // Get block number finalized
        // TODO: Get finalized from finalitytracker/final_hint extrinsic
        const blockNumberFinalized = 0;
    
        // Get election status
        const isElection = eraElectionStatus.toString() === `Close` ? false : true

        // Get block events, this may fail if api is not able to understand metadata!!!
        let blockEvents = [];
        try {
          blockEvents = await api.query.system.events.at(blockHash);
          blockEvents.forEach( async (record, index) => {
            const { event, phase } = record;
            const sql = 
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
              await pool.query(sql);
              logger.info(loggerOptions, `Added event #${endBlock}-${index} ${event.section} ➡ ${event.method}`);
            } catch (error) {
              logger.error(loggerOptions, `Error adding event #${endBlock}-${index}: ${error}, sql: ${sql}`);
            }
          });
        } catch (error) {
          logger.error(loggerOptions, `Error getting events for block ${endBlock} (${blockHash}): ${error}`);
          try {
            const timestamp = new Date().getTime();
            const errorString = error.toString().replace(/'/g, "''");
            const sql = `INSERT INTO failed_block (block_number, error, timestamp)
              VALUES ('${endBlock}', '${errorString}', '${timestamp}')
              ON CONFLICT ON CONSTRAINT failed_block_pkey DO NOTHING
            `;
            await pool.query(sql);
          } catch (error) {
            logger.error(loggerOptions, `Error inserting error for block #${endBlock} in failed_block table :-/ : ${error}`);
          }
        }
        
        // Get block extrinsics, this may fail if api is not able to understand metadata!!!
        let extrinsics = [];
        try {
          const { block } = await api.rpc.chain.getBlock(blockHash);
          extrinsics = block.extrinsics;
          await storeExtrinsics(pool, endBlock, extrinsics, blockEvents, loggerOptions);
        } catch (error) {
          logger.error(loggerOptions, `Error getting extrinsics for block ${endBlock} (${blockHash}): ${error}`);
          try {
            const timestamp = new Date().getTime();
            const errorString = error.toString().replace(/'/g, "''");
            const sql = `INSERT INTO failed_block (block_number, error, timestamp)
              VALUES ('${endBlock}', '${errorString}', '${timestamp}')
              ON CONFLICT ON CONSTRAINT failed_block_pkey DO NOTHING
            `;
            await pool.query(sql);
          } catch (error) {
            logger.error(loggerOptions, `Error inserting error for block #${endBlock} in failed_block table :-/ : ${error}`);
          }
        }
    
        const currentIndex = new BigNumber(ChainCurrentIndex);
        const currentSlot = new BigNumber(ChainCurrentSlot);
        const epochIndex = new BigNumber(ChainEpochIndex);
        const genesisSlot = new BigNumber(ChainGenesisSlot);
        const epochDuration = new BigNumber(api.consts.babe.epochDuration);
        const sessionsPerEra = new BigNumber(api.consts.staking.sessionsPerEra);
        const eraLength = epochDuration.multipliedBy(sessionsPerEra);
        const epochStartSlot = epochIndex.multipliedBy(epochDuration).plus(genesisSlot);
        const sessionProgress = currentSlot.minus(epochStartSlot);
    
        // We don't calculate eraProgress for harvested blocks
        const eraProgress = 0;
              
        // Total events
        const totalEvents = blockEvents.length;

        // Balance transfers count
        const numTransfers =
          extrinsics
            .filter(({ method }) => (method.section.toString() === `balances` && method.method.toString() === `transfer`))
            .length;
        
        // Find number of new accounts in this block
        const newAccounts =
          extrinsics
            .filter(({ method }) => (method.section.toString() === `balances` && method.method.toString() === `endowed`))
            .length;

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
            is_election,
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
            '${blockHeader.author}',
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
            '${isElection}',
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
          logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
        }
        endBlock--;
      } catch (error) {
        logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
        try {
          const timestamp = new Date().getTime();
          const errorString = error.toString().replace(/'/g, "''");
          const sql = `INSERT INTO failed_block (block_number, error, timestamp)
            VALUES ('${endBlock}', '${errorString}', '${timestamp}')
            ON CONFLICT ON CONSTRAINT failed_block_pkey DO NOTHING
          `;
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error inserting block #${endBlock} in failed_block table :-/ : ${error}`);
        }
        endBlock--;
      }
    }
  }
}