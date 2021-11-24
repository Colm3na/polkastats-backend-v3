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
  blockNumber, 
  event, 
  index,
  insertList = [
    'block_number','event_index', 'section', 'method', 'phase', 'data'
  ],
  sequelize
}) {
  const values = insertList.map(item => `:${item}`).join(',');
  
  console.log('add event->', event);
  
  const query = `INSERT INTO event(${insertList.join(',')}) VALUES (${values});`
  return await sequelize.query(query, {
    type: QueryTypes.INSERT,
    logging: false,
    replacements: {
      block_number: blockNumber,
      event_index: index,
      section: event.section,
      method: event.method,
      phase: event.phase.toString(),
      data: JSON.stringify(event.data),
    }
  });
}

module.exports = Object.freeze({
  get,
  add,
})