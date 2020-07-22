// @ts-check
const { shortHash, storeExtrinsics, storeLogs, getDisplayName, updateTotals } = require('../utils.js');
const pino = require('pino');
const logger = pino();

const loggerOptions = {
  crawler: `blockListener`
};

module.exports = {
  start: async function (api, pool, _config) {
    logger.info(loggerOptions, `Starting block listener...`);

    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads(async (header) => {

      // Get block number
      const blockNumber = header.number.toNumber();

      // Get finalized block number
      const blockNumberFinalized = await api.derive.chain.bestNumberFinalized();

      // Get block hash
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

      // Get signed block
      const { block } = await api.rpc.chain.getBlock(blockHash);

      // Get extended block header
      const extendedHeader = await api.derive.chain.getHeader(blockHash);

      // Get block parent hash
      const parentHash = header.parentHash;
      
      // Get block extrinsics root
      const extrinsicsRoot = header.extrinsicsRoot;

      // Get block state root
      const stateRoot = header.stateRoot;

      // Get block author
      const blockAuthor = extendedHeader.author;

      // Get block author identity display name
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

      // Get runtime spec name and version
      const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);

      // Get session info
      const { currentEra, currentIndex, eraLength, isEpoch, sessionsPerEra, validatorCount, eraProgress, sessionProgress } = await api.derive.session.progress();
      
      // Get epoch duration
      const epochDuration = api.consts.babe.epochDuration;

      // Update validator produced_blocks
      let sql = `SELECT produced_blocks FROM validator WHERE session_index = '${currentIndex}' AND account_id = '${blockAuthor}'`;
      let res = await pool.query(sql);
      if (res.rows.length > 0) {
        const producedBlocks = parseInt(res.rows[0].produced_blocks) + 1;
        sql = `UPDATE validator SET produced_blocks = '${producedBlocks}' WHERE session_index = '${currentIndex}' AND account_id = '${blockAuthor}'`;
        try {
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error updating validator produced_blocks: ${JSON.stringify(error)}`);
        }
      }

      // Handle chain reorganizations
      sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
      res = await pool.query(sql);
      if (res.rows.length > 0) {
        // Chain reorganization detected! We need to update block_author, block_hash and state_root
        logger.info(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);

        // Get block author
        const blockAuthor = extendedHeader.author;

        // Get block author identity display name
        const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
        const blockAuthorName = blockAuthorIdentity.identity.display || ``;

        sql =
          `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
        res = await pool.query(sql);

      } else {

        // Get block events
        const blockEvents = await api.query.system.events.at(blockHash);

        // Get election status
        const eraElectionStatus = await api.query.staking.eraElectionStatus()
        const isElection = eraElectionStatus.toString() === `Close` ? false : true
        
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

        // Store new block
        logger.info(loggerOptions, `Adding block #${blockNumber} (${shortHash(blockHash.toString())})`);
        
        const timestampMs = await api.query.timestamp.now.at(blockHash);
        const timestamp = Math.floor(timestampMs / 1000);

        sql =
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
            '${blockNumber}',
            '${blockNumberFinalized}',
            '${blockAuthor}',
            '${blockAuthorName}',
            '${blockHash}',
            '${parentHash}',
            '${extrinsicsRoot}',
            '${stateRoot}',
            '${currentEra.toString()}',
            '${currentIndex.toString()}',
            '${eraLength.toString()}',
            '${eraProgress.toString()}',
            '${isEpoch}',
            '${isElection}',
            '${epochDuration.toString()}',
            '${sessionsPerEra.toString()}',
            '${sessionProgress.toString()}',
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
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}, sql: ${sql}`);
        }

        // Store block logs
        await storeLogs(pool, blockNumber, block.header.digest.logs, loggerOptions);

        // Store block extrinsics
        await storeExtrinsics(pool, blockNumber, block.extrinsics, blockEvents, loggerOptions);

        // Loop through the Vec<EventRecord>
        await blockEvents.forEach( async (record, index) => {
          // Extract the phase and event
          const { event, phase } = record;

          let sql = `SELECT FROM event WHERE block_number = '${blockNumber}' AND event_index = '${index}';`;
          let res = await pool.query(sql);

          if (res.rows.length === 0) {
        
            sql = 
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
              )
              ON CONFLICT ON CONSTRAINT event_pkey 
              DO NOTHING
              ;`;
            try {
              await pool.query(sql);
              logger.info(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
            } catch (error) {
              logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
            }
          }
        });

        await updateTotals(pool, loggerOptions);
      }
    });
  }
}