const { QueryTypes, Sequelize } = require("sequelize");

async function get({
  blockNumber,
  sequelize
}) {

  const result = await sequelize.query(
    `SELECT block_number FROM block WHERE block_number = :blockNumber`,
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

  await sequelize.query(
    `UPDATE block SET ${values} WHERE block_number = :block_number`,
    {
      type: QueryTypes.UPDATE,
      logging: false,
      replacements: {
        block_author: blockInfo.blockAuthor,
        block_author_name: blockInfo.blockAuthorIdentity.identity?.display || ``,
        block_hash: blockInfo.blockHash,
        state_root: blockInfo?.stateRoot || null,
        block_number: blockNumber,
      },
    }
  )
}

async function add({
  blockNumber,
  block,
  sequelize,
  insertList = []
}) {

}

module.exports = Object.freeze({
  get,
  modify,
  add,
})