import { Pool } from 'pg';
import { ILoggerOptions } from './../types/type';
import { ApiPromise } from '@polkadot/api';
import pino from 'pino'
import { storeEraStakingInfo } from '../lib/utils'
const logger = pino()

const loggerOptions: ILoggerOptions = {
  crawler: 'eraListener'
}

async function start(api: ApiPromise, pool: Pool, _config: any, substrateNetwork: string): Promise<void> {
  const denom = {
    polkadot: 'DOT'
  }

  logger.info(loggerOptions, `Starting eraListener crawler...`);
    let currenKnownEraIndex:number ;

    // Get last era index stored in DB
    const sqlSelect:string = `SELECT era_index FROM validator_era_staking ORDER BY era_index DESC LIMIT 1`;
    const res: any = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currenKnownEraIndex = parseInt(res.rows[0]["era_index"]);
      logger.info(loggerOptions, `Last era index in DB is #${currenKnownEraIndex}`);
    } else {
      logger.info(loggerOptions, `First execution, no era index found in DB!`);
      let activeEra:any = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = parseInt(activeEra.index);
      currenKnownEraIndex = currentEraIndex;
      // Store rewards and slashes for the previous era
      await storeEraStakingInfo(api, pool, currentEraIndex - 1, denom, loggerOptions);
    }

    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads( async () => {

      let activeEra: any = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex: number = activeEra.index;

      if (currentEraIndex > currenKnownEraIndex) {
        currenKnownEraIndex = currentEraIndex;
        await storeEraStakingInfo(api, pool, currentEraIndex - 1, denom, loggerOptions);
      }
    });
}
export { start }
