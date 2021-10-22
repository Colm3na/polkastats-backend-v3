import Sequelize from 'sequelize'
import pino from 'pino'
import { wait, storeEraStakingInfo } from '../utils/utils.js';

const logger = pino();
const { QueryTypes } = Sequelize

const loggerOptions = {
  crawler: `eraHarvester`
};

const denoms = {
  polkadot: `DOT`
};

const START_DELAY = 1 * 60 * 1000;

export async function start({ api, sequelize, config, substrateNetwork}) {
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
      logger.info(loggerOptions, `eraIndex ${eraIndex}`)

      const res = await sequelize.query('SELECT era_index FROM validator_era_staking WHERE era_index = :eraIndex LIMIT 1', {
        type: QueryTypes.SELECT,
        replacements: {
          eraIndex
        },
        plain: true
      });
      if (!res) {
        await storeEraStakingInfo(api, sequelize, eraIndex, denom, loggerOptions);
      }
    }
  }
}