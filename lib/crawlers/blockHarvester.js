// @ts-check
const { BigNumber } = require('bignumber.js');
const { shortHash, storeExtrinsics } = require('../utils.js');

module.exports = {
  start: async function(api, pool, config) {
    console.log(
      `[PolkaStats backend v3] - \x1b[32mStarting block harvester...\x1b[0m`
    );

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
        console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mDetected gap! Harvesting blocks from #${res.rows[i].gap_end} to #${res.rows[i].gap_start}\x1b[0m`);
        await module.exports.harvestBlocks(api, pool, parseInt(res.rows[i].gap_start), parseInt(res.rows[i].gap_end));
      }
    }
  
    // Execution end time
    const endTime = new Date().getTime();
  
    // 
    // Log execution time
    //
    console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mAdded ${addedBlocks} blocks in ${((endTime - startTime) / 1000).toFixed(0)}s\x1b[0m`);
    console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mNext execution in 60m...\x1b[0m`);

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

      // Get signed block
      const { block } = await api.rpc.chain.getBlock(blockHash);
      
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

      // Store block extrinsics
      await storeExtrinsics(pool, endBlock, block.extrinsics);

      // Get block number finalized
      // TODO: Get finalized from finalitytracker/final_hint extrinsic
      const blockNumberFinalized = 0;

      // Delete before insert to avoid duplicate key errors (issue #48)
      let sqlDelete = `DELETE FROM event WHERE block_number = '${endBlock}';`;
      try {
        await pool.query(sqlDelete);
      } catch (error) {
        console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError deleting events for block #${endBlock}: ${error}, sql: ${sqlDelete}\x1b[0m`);
      }

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
          );`;
        try {
          await pool.query(sqlInsert);
          console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32m=> Adding event #${endBlock}-${index} ${event.section} => ${event.method}\x1b[0m`);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError adding event #${endBlock}-${index}: ${error}, sql: ${sqlInsert}\x1b[0m`);
        }
      });
      // Get session info for the block
      const currentIndex = new BigNumber(await api.query.session.currentIndex.at(blockHash));
      const currentSlot = new BigNumber(await api.query.babe.currentSlot.at(blockHash));
      const epochIndex = new BigNumber(await api.query.babe.epochIndex.at(blockHash));
      const genesisSlot = new BigNumber(await api.query.babe.genesisSlot.at(blockHash));
      const currentEra = new BigNumber(await api.query.staking.currentEra.at(blockHash));

      // CAUTION: This only works for the last HISTORY_DEPTH eras (api.query.staking.historyDepth)
      const erasStartSessionIndex = await api.query.staking.erasStartSessionIndex(currentEra.toString());
      const currentEraStartSessionIndex = new BigNumber(erasStartSessionIndex);

      if (currentEraStartSessionIndex) {
      
        const validatorCount = await api.query.staking.validatorCount.at(blockHash);
        
        const epochDuration = new BigNumber(api.consts.babe.epochDuration);
        const sessionsPerEra = new BigNumber(api.consts.staking.sessionsPerEra);
        const eraLength = epochDuration.multipliedBy(sessionsPerEra);
        const epochStartSlot = epochIndex.multipliedBy(epochDuration).plus(genesisSlot);
        const sessionProgress = currentSlot.minus(epochStartSlot);

        // console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mEra progress calculation, currentIndex is ${currentIndex.toString()}}, currentEraStartSessionIndex is ${currentEraStartSessionIndex.toString()}}, epochDuration is ${epochDuration.toString()}}, sessionProgress is ${sessionProgress.toString()}\x1b[0m`);

        const eraProgress = new BigNumber(currentIndex)
          .minus(currentEraStartSessionIndex)
          .multipliedBy(epochDuration)
          .plus(sessionProgress)
        
        // Get block author
        const blockAuthor = extendedHeader.author;

        // Update validator_produced_blocks table
        let sql = `SELECT produced_blocks FROM validator_produced_blocks WHERE session_index = '${currentIndex}' AND account_id = '${blockAuthor}'`;
        let res = await pool.query(sql);
        if (res.rows.length > 0) {
          const producedBlocks = parseInt(res.rows[0].produced_blocks) + 1;
          sql = `UPDATE validator_produced_blocks SET produced_blocks = '${producedBlocks}' WHERE session_index = '${currentIndex}' AND account_id = '${blockAuthor}'`;
          try {
            await pool.query(sql);
          } catch (error) {
            console.log(`Error updating validator_produced_blocks: ${JSON.stringify(error)}`)
          }
        } else {
          sql = `INSERT INTO validator_produced_blocks (session_index, account_id, produced_blocks, timestamp) VALUES ('${currentIndex}', '${blockAuthor}', '1', extract(epoch from now()));`;
          try {
            await pool.query(sql);
          } catch (error) {
            console.log(`Error updating validator_produced_blocks: ${JSON.stringify(error)}`)
          }
        }
        
        // Get block author identity display name
        const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
        const blockAuthorName = blockAuthorIdentity.identity.display || ``;
        
        // Get runtime spec name and version
        const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);
        
        const timestampMs = await api.query.timestamp.now.at(blockHash);
        const timestamp = Math.floor(timestampMs / 1000);
          
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

        // Delete before insert to avoid duplicate key errors (issue #48)
        sqlDelete = `DELETE FROM block WHERE block_number = '${endBlock}';`;
        try {
          await pool.query(sqlDelete);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError deleting events for block #${endBlock}: ${error}, sql: ${sqlDelete}\x1b[0m`);
        }

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
            '${totalEvents}',
            '${numTransfers}',
            '${newAccounts}',
            '${timestamp}'
          )`;
        try {
          await pool.query(sqlInsert);
          const endTime = new Date().getTime();
          console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mAdded block #${endBlock} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s\x1b[0m`);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Block harvester - \x1b[31mError adding block #${endBlock}: ${error.error}\x1b[0m`);
        }
        endBlock--;
        addedBlocks++;
      } else {
        console.log(`[PolkaStats backend v3] - Block harvester - \x1b[32mEnd of history depth reached, stopping!\x1b[0m`);
      }
    }
  }
}