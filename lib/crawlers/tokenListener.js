const pino = require('pino')
const {
  updateTotals
} = require('../utils.js')
const logger = pino()


const loggerOptions = {
  crawler: "tokenListener",
};

const start = async function (api, pool, config) {
  logger.info(loggerOptions, "Starting token crawler...");
  updateTotals(pool, loggerOptions)
};

module.exports = { start }