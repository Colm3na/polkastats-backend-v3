// @ts-check
const pino = require('pino');
const logger = pino();
const { wait, storeEraStakingInfo } = require('../utils.js');

const loggerOptions = {
  crawler: `eraHarvester`
};

const denoms = {
  polkadot: `DOT`,
  kusama: `KSM`,
  westend: `WND`
};

const START_DELAY = 1 * 60 * 1000;

module.exports = {
  start: async function (api, pool, _config, substrateNetwork) {

    const denom = denoms[substrateNetwork];

    logger.info(loggerOptions, `Delaying execution for ${START_DELAY / 1000}s ...`);
    await wait(START_DELAY);
    logger.info(loggerOptions, `Starting eraHarvester crawler...`)

    logger.info(loggerOptions, `Fetching active era...`)
    let activeEra = await api.query.staking.activeEra();
    logger.info(loggerOptions, `ActiveEra is ${JSON.stringify(activeEra)}`)

    activeEra = JSON.parse(JSON.stringify(activeEra));
    const currentEraIndex = activeEra.index;
    logger.info(loggerOptions, `Current era is ${currentEraIndex}`)
    const historyDepth = await api.query.staking.historyDepth();
    logger.info(loggerOptions, `History depth is ${historyDepth}`)

    if (currentEraIndex > 0) {
      for (let eraIndex = currentEraIndex - 1; eraIndex >= currentEraIndex - historyDepth && eraIndex > 0; eraIndex--) {
        const sql = `SELECT era_index FROM validator_era_staking WHERE era_index = '${eraIndex}' LIMIT 1`;
        const res = await pool.query(sql);
        if (res.rows.length === 0) {
          logger.info(loggerOptions, `Fetching era staking info for era ${currentEraIndex}, history depth is ${historyDepth}`)
          await storeEraStakingInfo(api, pool, eraIndex, denom, loggerOptions);
        } else {
          logger.error(loggerOptions, `Era staking for era ${currentEraIndex} already stored`)
        }

      }
    }    
  }
}