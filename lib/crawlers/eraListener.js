// @ts-check
const { BigNumber } = require('bignumber.js');
const pino = require('pino');
const logger = pino();
const { storeEraStakingInfo } = require('../utils.js');

const loggerOptions = {
  crawler: `eraListener`
};

const denoms = {
  polkadot: `DOT`,
  kusama: `KSM`,
  westend: `WND`
};

module.exports = {
  start: async function (api, pool, _config, substrateNetwork) {

    const denom = denoms[substrateNetwork];

    logger.info(loggerOptions, `Starting eraListener crawler...`);
    let currenKnownEraIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT era_index FROM reward ORDER BY era_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currenKnownEraIndex = parseInt(res.rows[0]["era_index"]);
      logger.info(loggerOptions, `Last era index in DB is #${currenKnownEraIndex}`);
    } else {
      logger.info(loggerOptions, `First execution, no era index found in DB!`);
      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = parseInt(activeEra.index);
      currenKnownEraIndex = currentEraIndex;
      // Store rewards and slashes for the previous era
      await storeEraStakingInfo(api, pool, currentEraIndex - 1, denom);
    }

    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads( async () => {

      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = activeEra.index;

      if (currentEraIndex > currenKnownEraIndex) {
        currenKnownEraIndex = currentEraIndex;
        await storeEraStakingInfo(api, pool, currentEraIndex - 1);
      }
    });
  }
}