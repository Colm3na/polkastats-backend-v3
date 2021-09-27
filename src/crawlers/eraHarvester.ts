import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import pino from 'pino'
import { wait, storeEraStakingInfo } from '../lib/utils'
const logger = pino()

const loggerOptions: ILoggerOptions = {
  crawler: 'eraHarvester'
}


const START_DELAY = 1 * 60 * 1000;

async function start(api: ApiPromise, pool: Pool, _config: any, substrateNetwork: string): Promise<void> {
    const denom = {
      polkadot: 'DOT'
    }

    logger.info(loggerOptions, `Delaying execution for ${START_DELAY / 1000}s ...`);
    await wait(START_DELAY);
    logger.info(loggerOptions, `Starting eraHarvester crawler...`)

    let activeEra: any = await api.query.staking.activeEra();

    activeEra = JSON.parse(JSON.stringify(activeEra));

    const currentEraIndex = activeEra.index;
    const historyDepth: any = await api.query.staking.historyDepth();

    if (currentEraIndex > 0) {
      for (let eraIndex = currentEraIndex - 1; eraIndex >= currentEraIndex - historyDepth && eraIndex > 0; eraIndex--) {
        logger.info(loggerOptions, `eraIndex ${eraIndex}`)
        const sql = `SELECT era_index FROM validator_era_staking WHERE era_index = '${eraIndex}' LIMIT 1`;
        const res = await pool.query(sql);
        if (res.rows.length === 0) {
          await storeEraStakingInfo(api, pool, eraIndex, denom, loggerOptions);
        }
      }
    }    
}

export { start }