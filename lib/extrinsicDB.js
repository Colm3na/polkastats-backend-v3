const { QueryTypes } = require('sequelize');

async function add({
  extrinsic,
  sequelize,
  insertList = [
    'block_number',
    'extrinsic_index',
    'is_signed',
    'signer',
    'section',
    'method',
    'args',
    'hash',
    'doc',
    'success',
    'amount',
    'timestamp',
    'block_index',
  ]
}) {
  const values = insertList.map(item => `:${item}`).join(',');

  await sequelize.query(
    `INSERT INTO extrinsic (${insertList.join(',')}) VALUES(${values})
    ON CONFLICT ON CONSTRAINT extrinsic_pkey DO NOTHING;`, {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: extrinsic
    }
  )
}


module.exports = Object.freeze({
  add
});