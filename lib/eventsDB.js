const { QueryTypes } = require("sequelize");

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

async function add({
  event,
  insertList = [
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
  const values = insertList.map(item => `:${item}`).join(',');

  await sequelize.query(`INSERT INTO event(${insertList.join(',')}) VALUES (${values});`, {
    type: QueryTypes.INSERT,
    logging: false,
    replacements: event
  });
}

module.exports = Object.freeze({
  get,
  add,
})