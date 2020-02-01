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

  // Start execution
  const startTime = new Date().getTime();
  
  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // Database connection
  const pool = new Pool(postgresConnParams);

  // Chain health check
  let currentBlock = 1;
  let sqlSelect = `SELECT MIN(block_number) AS min_block_number FROM block`;
  let res = await pool.query(sqlSelect);
  let endBlock = res.rows[0].min_block_number;

  while (currentBlock < endBlock) {

    // Get block hash
    const blockHash = await api.rpc.chain.getBlockHash(currentBlock);

    // Get extended block header
    const extendedHeader = await api.derive.chain.getHeader(blockHash);
    // console.log(JSON.stringify(extendedHeader, null, 2));

    // Get block parent hash
    const parentHash = extendedHeader.parentHash;
    
    // Get block extrinsics root
    const extrinsicsRoot = extendedHeader.extrinsicsRoot;

    // Get block state root
    const stateRoot = extendedHeader.stateRoot;

    //
    //     TODO:
    //
    //   * Get timestamp from block
    //   * Get session info at block
    //   * Get total issuance at block
    //
    console.log(`PolkaStats - Block crawler - Block: #${currentBlock}`);
    const timestamp = new Date().getTime();
    const sqlInsert =
      `INSERT INTO block (
        block_number,
        block_finalized,
        block_author,
        block_hash,
        parent_hash,
        extrinsics_root,
        state_root
        timestamp
      ) VALUES (
        '${currentBlock}',
        '${currentBlock}',
        '${extendedHeader.author}',
        '${blockHash}',
        '${parentHash}',
        '${extrinsicsRoot}',
        '${stateRoot}',
        '${timestamp}'
      )`;
    const res = await pool.query(sqlInsert);
    currentBlock++;
  }

  await pool.end();

  // Execution end time
  const endTime = new Date().getTime();

  // 
  // Log execution time
  //
  console.log(`Execution time: ${((endTime - startTime) / 1000).toFixed(0)}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});

