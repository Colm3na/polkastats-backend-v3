const { QueryTypes } = require('sequelize');

async function save({
  extrinsic,
  sequelize,
  fields = [
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
    'to_owner',
  ],
  transaction = null,
}) {
  const values = fields.map(item => `:${item}`).join(',');
  const updateFields = fields.map((item) => `${item} = :${item}`).join(',');

  await sequelize.query(
    `
      INSERT INTO extrinsic (${fields.join(',')}) VALUES(${values})
      ON CONFLICT ON CONSTRAINT extrinsic_pkey
      DO UPDATE SET ${updateFields};
    `,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: extrinsic,
      transaction,
    },
  );
}


module.exports = Object.freeze({
  save
});