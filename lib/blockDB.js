const { QueryTypes } = require("sequelize");

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

async function modify({
  blockInfo,
  sequelize,
  updateList = ['']
}) {  
}

module.exports = Object.freeze({
  get,
})