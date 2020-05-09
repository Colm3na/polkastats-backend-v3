// @ts-check
const { shortHash } = require('../utils.js');
const {BigNumber} = require('bignumber.js');

module.exports = {
  start: async function (api, pool, _config) {
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting block listener...\x1b[0m`);

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
      const blockAuthorName = blockAuthorIdentity.identity.display || ``;

      // Get runtime spec name and version
      const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);

      // Get session info
      const isEpoch = true;
      const validatorCount = await api.query.staking.validatorCount.at(blockHash);
      const currentIndex = new BigNumber(await api.query.session.currentIndex.at(blockHash));
      const currentEra = new BigNumber(await api.query.staking.currentEra.at(blockHash));
      const erasStartSessionIndex = new BigNumber(await api.query.staking.erasStartSessionIndex(currentEra.toString()));
      const currentSlot = new BigNumber(await api.query.babe.currentSlot.at(blockHash));
      const epochIndex = new BigNumber(await api.query.babe.epochIndex.at(blockHash));
      const genesisSlot = new BigNumber(await api.query.babe.genesisSlot.at(blockHash));
      const epochDuration = new BigNumber(api.consts.babe.epochDuration);
      const sessionsPerEra = new BigNumber(api.consts.staking.sessionsPerEra);
      const eraLength = epochDuration.multipliedBy(sessionsPerEra);
      const epochStartSlot = new BigNumber(epochIndex).multipliedBy(epochDuration).plus(genesisSlot); 
      const sessionProgress = currentSlot.minus(epochStartSlot);
      const eraProgress = new BigNumber(currentIndex)
        .minus(erasStartSessionIndex)
        .multipliedBy(epochDuration)
        .plus(sessionProgress)

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

      // Handle chain reorganizations
      sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
      res = await pool.query(sql);
      if (res.rows.length > 0) {
        // Chain reorganization detected! We need to update block_author, block_hash and state_root
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[32mDetected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root\x1b[0m`);

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
        console.log(`[PolkaStats backend v3] - Block listener - \x1b[32mAdding block #${blockNumber} (${shortHash(blockHash.toString())})\x1b[0m`);
        
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
          )`;

        try {
          await pool.query(sql);
        } catch (error) {
          if (`${error}`.indexOf(`duplicate key value violates unique constraint`) !== -1) {
            console.log(`[PolkaStats backend v3] - Block listener - \x1b[33mBlock #${blockNumber} already added!\x1b[0m`);
          } else {
            console.log(`[PolkaStats backend v3] - Block listener - \x1b[31mError adding block #${blockNumber}: ${error}, sql: ${sql}\x1b[0m`);
          }
        }

        // Store extrinsics
        await module.exports.storeExtrinsics(pool, blockNumber, block.extrinsics);

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
              );`;
            try {
              await pool.query(sql);
              console.log(`[PolkaStats backend v3] - Block listener - \x1b[32m=> Adding event #${blockNumber}-${index} ${event.section} => ${event.method}\x1b[0m`);
          
            } catch (error) {
              if (`${error}`.indexOf(`duplicate key value violates unique constraint`) !== -1) {
                console.log(`[PolkaStats backend v3] - Block listener - \x1b[33m=> Event #${blockNumber}-${index} already added!\x1b[0m`);
              } else {
                console.log(`[PolkaStats backend v3] - Block listener - \x1b[31m=> Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}\x1b[0m`);
              }
            }
          }
        });
      }
    });
  },
  storeExtrinsics: async function (pool, blockNumber, extrinsics) {

    extrinsics.forEach((extrinsic, index) => {

      const signer = extrinsic.signer.toString();
      const section = extrinsic.toHuman().section;
      const method = extrinsic.toHuman().method;
      const args = JSON.parse(JSON.stringify(extrinsic.args));
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString();

      console.log(`Extrinsic: ${blockNumber}-${index} signer: ${signer} section: ${section} method: ${method} args: ${args} hash: ${hash} doc: ${doc}`)

    });
    return true
  }
}