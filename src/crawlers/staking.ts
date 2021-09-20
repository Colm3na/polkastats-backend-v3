import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import BigNumber from "bignumber.js";
import { getDisplayName } from './../lib/utils'
import pino from 'pino'

const logger = pino()
const loggerOptions: ILoggerOptions = {
  crawler: 'staking'
}

async function storeSessionStakingInfo(api: ApiPromise, pool: Pool, blockNumber:any, sessionInfo:any, currentEraIndex: any): Promise<any> {
  
}

async function start(api: ApiPromise, pool: Pool, _config: any): Promise<void> {
  
}

export { start, storeSessionStakingInfo }