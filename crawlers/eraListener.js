import { storeEraStakingInfo } from '../utils/utils.js';
import pino from 'pino'

const logger = pino();
const { QueryTypes } = Sequelize

const loggerOptions = {
  crawler: `eraListener`
};

const denoms = {
  polkadot: `DOT`  
};

export async function start({api, sequelize, config, substrateNetwork}) {

  const denom = denoms[substrateNetwork];

  logger.info(loggerOptions, `Starting eraListener crawler...`);
  let currenKnownEraIndex;

  const res = await sequelize.query('SELECT era_index FROM validator_era_staking ORDER BY era_index DESC LIMIT 1', {
    type: QueryTypes.SELECT,
    plain: true
  });
  
  if (res) {
    currenKnownEraIndex = parseInt(res.era_index);
    logger.info(loggerOptions, `Last era index in DB is #${currenKnownEraIndex}`);
  } else {
    logger.info(loggerOptions, `First execution, no era index found in DB!`);
    let activeEra = await api.query.staking.activeEra();
    activeEra = JSON.parse(JSON.stringify(activeEra));
    const currentEraIndex = parseInt(activeEra.index);
    currenKnownEraIndex = currentEraIndex;
    // Store rewards and slashes for the previous era
    await storeEraStakingInfo(api, pool, currentEraIndex - 1, denom, loggerOptions);
  }

  // Subscribe to new blocks
  await api.rpc.chain.subscribeNewHeads( async () => {

    let activeEra = await api.query.staking.activeEra();
    activeEra = JSON.parse(JSON.stringify(activeEra));
    const currentEraIndex = activeEra.index;

    if (currentEraIndex > currenKnownEraIndex) {
      currenKnownEraIndex = currentEraIndex;
      await storeEraStakingInfo(api, pool, currentEraIndex - 1, loggerOptions);
    }
  });

}