const { shortHash } = require('../utils.js');

module.exports = {
  subscribeToNewBlocks: async function (api, pool) {
    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads(async (header) => {

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

      // Get block author
      const blockAuthor = extendedHeader.author;

      // Get block author identity display name
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
      const blockAuthorName = blockAuthorIdentity.identity.display || ``;

      // Get runtime spec name and version
      const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);

      // Get session info
      const session = await api.derive.session.info();

      // Handle chain reorganizations
      const sqlSelect = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
      const res = await pool.query(sqlSelect);
      if (res.rows.length > 0) {
        // Chain reorganization detected! We need to update block_author, block_hash and state_root
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[32mDetected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root\x1b[0m`);

        // Get block author
        const blockAuthor = extendedHeader.author;

        // Get block author identity display name
        const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
        const blockAuthorName = blockAuthorIdentity.identity.display || ``;

        const sqlUpdate =
          `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
        const res = await pool.query(sqlUpdate);

      } else {
        // Store new block
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[32mAdding block #${blockNumber} (${shortHash(blockHash.toString())})\x1b[0m`);
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

        try {
          await pool.query(sqlInsert);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Block listener - \x1b[31mError: ${error}\x1b[0m`);
        }

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
              '${blockNumber}',
              '${index}',
              '${event.section}',
              '${event.method}',
              '${phase.toString()}',
              '${JSON.stringify(event.data)}'
            );`;
          try {
            await pool.query(sqlInsert);
            console.log(`[PolkaStats backend v3] - Block listener - \x1b[32m=> Adding event #${blockNumber}-${index} ${event.section} => ${event.method}\x1b[0m`);
        
          } catch (error) {
            console.log(`[PolkaStats backend v3] - Block listener - \x1b[31m=> Error adding event #${blockNumber}-${index}: ${error.error}\x1b[0m`);
          }
        });
      }
    });
  }
}