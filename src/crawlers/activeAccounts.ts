import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import { zip } from 'lodash'
import pino from 'pino'

const DEFAULT_POLLING_TIME_MS = 1 * 60 * 1000;
const logger = pino()
const loggerOptions: ILoggerOptions = {
  crawler: 'activeAccounts'
}

async function exec(api: ApiPromise, pool: Pool): Promise<void> {
  
}

async function start(api: ApiPromise, pool: Pool, config: any): Promise<void> {
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS;

  (async function run() {
    await exec(api, pool).catch(err =>
      logger.error(loggerOptions, `Error running crawler: ${err}`),
    );

    setTimeout(() => run(), pollingTime);
  })();
}

export { start }