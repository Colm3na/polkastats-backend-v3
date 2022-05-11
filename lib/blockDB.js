const { QueryTypes, Sequelize } = require("sequelize");

async function get({
  blockNumber,
  sequelize
}) {

  const result = await sequelize.query(
    `SELECT block_hash, state_root, block_number FROM block WHERE block_number = :blockNumber`,
    {
      type: QueryTypes.SELECT,
      logging: false,
      replacements: {
        blockNumber,
      },
    }
  );  
  return result;
}

async function firstBlock(sequelize) {
  const query = `select block_number 
  from block order by block_number asc limit 1`;
  const res = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    logging: false
  });
  return res?.block_number ? Number(res?.block_number) : null;
}

async function save({
  blockNumber,
  block,
  sequelize,
  fields = [
    'block_number',
    'block_hash',
    'parent_hash',
    'extrinsics_root',
    'state_root',
    'session_length',
    'spec_name',
    'spec_version',
    'total_events',
    'num_transfers',
    'new_accounts',
    'total_issuance',
    'timestamp',
    'need_rescan',
  ],
  transaction = null,
}) {
  
  const updateFields = fields.map((item) => `${item} = :${item}`).join(',');  
  const values = fields.map((item) => `:${item}`).join(',');
  const query = `INSERT INTO block (${fields.join(',')}) VALUES (
    ${values}
  )
  ON CONFLICT ON CONSTRAINT block_pkey
  DO UPDATE SET ${updateFields};`;

  await sequelize.query(query,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: {
        block_number: blockNumber,
        block_hash: block.blockHash.toString(),
        parent_hash: block.parentHash,
        extrinsics_root: block.extrinsicsRoot,
        state_root: block.stateRoot,
        session_length: block.sessionLength,
        spec_name: block.specName,
        spec_version: block.specVersion,
        total_events: block.blockEvents.length || 0,
        num_transfers: block.numTransfers,
        new_accounts: block.newAccounts,
        total_issuance: block.totalIssuance,
        timestamp: Math.floor(block.timestampMs / 1000),
        need_rescan: false,
      },
      transaction,
    }
  );  
}

async function getBlocksGaps({
  sequelize
}) {
  const blocksGaps = await sequelize.query(
    `SELECT
    block_number AS "gapStart", 
    next_nr AS "gapEnd"
      FROM (
        SELECT block_number, 
              LEAD(block_number) OVER (ORDER BY block_number) AS next_nr
        FROM block
      ) nr
      WHERE block_number + 1 <> next_nr;
    `,
    {
      type: QueryTypes.SELECT,
      logging: false,
    }
  );

  return blocksGaps ?
    blocksGaps.map((blocksGap) => ({ gapStart: Number(blocksGap.gapStart), gapEnd: Number(blocksGap.gapEnd) })) :
    [];
}

async function lastBlock(sequelize) {
  const query = `select block_number from block order by block_number desc limit 1`;
  const res = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    logging: false
  });
  return res?.block_number ? Number(res?.block_number) : null;
}

async function getBlocksForRescan({
  sequelize,
  limit = 1,
}) {

  return sequelize.query(
    `SELECT block_number FROM block WHERE need_rescan = true order by block_number limit ${limit}`,
    {
      type: QueryTypes.SELECT,
      logging: false,
      plain: false,
    },
  );  
}

module.exports = Object.freeze({
  get,
  save,
  firstBlock,
  lastBlock,
  getBlocksGaps,
  getBlocksForRescan,
})