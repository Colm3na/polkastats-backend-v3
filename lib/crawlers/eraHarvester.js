// @ts-check
const { BigNumber } = require('bignumber.js');
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

    let activeEra = await api.query.staking.activeEra();
    activeEra = JSON.parse(JSON.stringify(activeEra));
    const currentEraIndex = activeEra.index;
    const historyDepth = await api.query.staking.historyDepth();

    if (currentEraIndex > 0) {
      for (let eraIndex = currentEraIndex - 1; eraIndex >= currentEraIndex - historyDepth && eraIndex > 0; eraIndex--) {
        const sql = `SELECT era_index FROM validator_staking_era WHERE era_index = '${eraIndex}' LIMIT 1`;
        const res = await pool.query(sql);
        if (res.rows.length === 0) {
          await storeEraStakingInfo(api, pool, eraIndex, denom, loggerOptions);
        }
      }
    }    
  }
}