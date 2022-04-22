const { QueryTypes } = require('sequelize');

async function get({
  blockNumber, index, sequelize
}) {
  const query = `SELECT FROM event WHERE block_number = :blockNumber AND event_index = :index`;
  return await sequelize.query(query, {
    type: QueryTypes.SELECT,
    logging: false,
    plain: true,
    replacements: {
      blockNumber,
      index
    }
  });
}

async function save({
  event,
  fields = [
    'block_number',
    'event_index',
    'section',
    'method',
    'phase',
    'data',
    'amount',
    'block_index',
    'timestamp',
  ],
  sequelize
}) {
  const values = fields.map(item => `:${item}`).join(',');
  const updateFields = fields.map((item) => `${item} = :${item}`).join(',');

  await sequelize.query(
    `
    INSERT INTO event(${fields.join(',')}) VALUES (${values})
    ON CONFLICT ON CONSTRAINT event_pkey
    DO UPDATE SET ${updateFields};
    `,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: event
    },
  );
}

module.exports = Object.freeze({
  get,
  save,
})