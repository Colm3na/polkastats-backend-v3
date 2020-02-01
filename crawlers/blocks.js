// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Postgres lib
const { Pool, Client } = require('pg');

// Import config params
const {
  wsProviderUrl,
  postgresConnParams
} = require('../backend.config');

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

    // Get best finalized block, total issuance and session info
    const [blockFinalized, totalIssuance, session] = await Promise.all([
      api.derive.chain.bestNumberFinalized(), 
      api.query.balances.totalIssuance(),
      api.derive.session.info()
    ]);

    console.log(`PolkaStats - Block crawler - Best block: #${blockNumber} finalized: #${blockFinalized}`);
    // console.log(`\tauthor: ${extendedHeader.author}`);
    // console.log(`\tblockHash: ${blockHash}`);
    // console.log(`\tparentHash: ${parentHash}`);
    // console.log(`\textrinsicsRoot: ${extrinsicsRoot}`);
    // console.log(`\tstateRoot: ${stateRoot}`);
    // console.log(`\ttotalIssuance: ${totalIssuance}`);
    console.log(`\tsession: ${JSON.stringify(session)}`);
    // session: {"currentEra":367,"currentIndex":1552,"eraLength":3600,"eraProgress":3072,"isEpoch":true,"sessionLength":600,"sessionsPerEra":6,"sessionProgress":72,"validatorCount":160}

    // TODO: Handle chain reorganizations: check if block_number already exist in DB, if yes update the data for it

    if (blockNumber) {
      // Database connection
      const pool = new Pool(postgresConnParams);
      const timestamp = new Date().getTime();
      var sqlInsert =
        `INSERT INTO block (
          block_number,
          block_finalized,
          block_author,
          block_hash,
          parent_hash,
          extrinsics_root,
          state_root,
          total_issuance,
          current_era,
          current_index,
          era_length,
          era_progress,
          is_epoch,
          session_length,
          session_per_era,
          session_progress,
          validator_count,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${blockFinalized}',
          '${extendedHeader.author}',
          '${blockHash}',
          '${parentHash}',
          '${extrinsicsRoot}',
          '${stateRoot}',
          '${totalIssuance}',
          '${session.currentEra}',
          '${session.currentIndex}',
          '${session.eraLength}',
          '${session.eraProgress}',
          '${session.isEpoch}',
          '${session.sessionLength}',
          '${session.sessionsPerEra}',
          '${session.sessionProgress}',
          '${session.validatorCount}',
          '${timestamp}',
        )`;
      const res = await pool.query(sqlInsert);
      // We connect/disconnect to MySQL in each loop to avoid problems if database server is restarted while the crawler is running
      await pool.end();
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});

