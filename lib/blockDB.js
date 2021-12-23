const { QueryTypes, Sequelize } = require("sequelize");
const { getDisplayName } = require("../utils/utils");

async function get({
  blockNumber,
  sequelize
}) {

  const result = await sequelize.query(
    `SELECT block_author, block_author_name, block_hash, state_root, block_number FROM block WHERE block_number = :blockNumber`,
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
  return res?.block_number || 1;
}
/**
 * @param {Number} blockNumber
 * @param {Object} blockInfo {blockAuthor, blockAuthorIdentity, blockHash, stateRoot} 
 * @param {Sequelize} sequelize,
 */
async function modify({  
  blockNumber,
  blockInfo,
  sequelize,  
  updateList = [
    'block_author',
    'block_author_name',
    'block_hash',
    'state_root'
  ]
}) {

  const values = updateList.map((item) => `${item} = :${item}`).join(',');  
  try {
    await sequelize.query(
      `UPDATE block SET ${values} WHERE block_number = :block_number`,
      {
        type: QueryTypes.UPDATE,
        logging: false,
        replacements: {
          block_author: blockInfo.blockAuthor,
          block_author_name: blockInfo.blockAuthorIdentity.identity?.display || ``,
          block_hash: blockInfo.blockHash.toString(),
          state_root: blockInfo?.stateRoot || null,
          block_number: blockNumber,
        },
      }
    );
  } catch (error) {
    console.error(error);
  }  
}

async function add({
  blockNumber,
  block,
  sequelize,
  insertList = ['block_number', 'block_number_finalized', 'block_author', 'block_author_name',
    'block_hash', 'parent_hash', 'extrinsics_root', 'state_root', 'current_era', 'current_index',
    'era_length', 'era_progress', 'is_epoch', 'is_election', 'session_length', 'session_per_era',
    'session_progress', 'validator_count', 'spec_name', 'spec_version', 'total_events',
    'num_transfers', 'new_accounts', 'total_issuance', 'timestamp']
}) {
  
  const values = insertList.map((item) => `:${item}`).join(',');
  const query = `INSERT INTO block (${insertList.join(',')}) VALUES (
    ${values}
  )
  ON CONFLICT ON CONSTRAINT block_pkey
  DO NOTHING;`;

  await sequelize.query(query,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: {
        block_number: blockNumber,
        block_number_finalized: block.blockNumberFinalized,
        block_author: block.blockAuthor,
        block_author_name: getDisplayName(block.blockAuthorIdentity.identity),
        block_hash: block.blockHash.toString(),
        parent_hash: block.parentHash,
        extrinsics_root: block.extrinsicsRoot,
        state_root: block.stateRoot,
        current_era: 0,
        current_index: 0,
        era_length: 0,
        era_progress: 0,
        is_epoch: false,
        is_election: (block.eraElectionStatus?.toString() === `Close` ? false : true),
        session_length: block.sessionLength,
        session_per_era: 0,
        session_progress: 0,
        validator_count: 0,
        spec_name: block.specName,
        spec_version: block.specVersion,
        total_events: block.blockEvents.length || 0,
        num_transfers: block.numTransfers,
        new_accounts: block.newAccounts,
        total_issuance: block.totalIssuance,
        timestamp: Math.floor(block.timestampMs / 1000),
      }
    }
  );  
}

module.exports = Object.freeze({
  get,
  modify,
  add,
  firstBlock,
})