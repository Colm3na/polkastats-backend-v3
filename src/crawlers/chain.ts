import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import pino from 'pino'

const logger = pino()
const loggerOptions: ILoggerOptions = {
  crawler: 'chain'
}

async function start(api: ApiPromise, pool: Pool): Promise<void> {
  logger.info(loggerOptions, `Starting chain crawler`);

  let isRunning = false;

  // Subscribe to new blocks
  await api.rpc.chain.subscribeNewHeads(async (header) => {

    logger.info(`last block #${header.number} has hash ${header.hash}`);
    
    if (!isRunning) {
      isRunning = true;
      const currentIndex = 0;
      const [blockHeight, totalIssuance] = await Promise.all([
        //api.derive.session.info(),
        api.derive.chain.bestNumber(),
        api.query.balances.totalIssuance()
      ]);

      let sqlSelect = `SELECT session_index FROM chain ORDER by session_index DESC LIMIT 1`;
      const res = await pool.query(sqlSelect);

      if (res.rows.length > 0) {
        const activeAccounts = await getTotalActiveAccounts(api);
        await insertRow(pool, blockHeight, currentIndex, totalIssuance, activeAccounts);
        /*if (res.rows[0].session_index < currentIndex) {
          const activeAccounts = await getTotalActiveAccounts(api);
          await insertRow(pool, blockHeight, currentIndex, totalIssuance, activeAccounts);
        }
      } else {
        const activeAccounts = await getTotalActiveAccounts(api);
        await insertRow(pool, blockHeight, currentIndex, totalIssuance, activeAccounts);*/
      }
      isRunning = false;
    }

  });
}

async function getTotalActiveAccounts(api: ApiPromise): Promise<any> {
  const accountKeys = await api.query.system.account.keys()
  const accounts = accountKeys.map(key => key.args[0].toHuman());
  return accounts.length || 0;
}

async function insertRow(pool: Pool, blockHeight: any, currentSessionIndex: any, totalIssuance:any, activeAccounts: any): Promise<any> {
  const sqlInsert: string = 
    `INSERT INTO chain (
      block_height,
      session_index,
      total_issuance,
      active_accounts,
      timestamp
    ) VALUES (
      '${blockHeight}',
      '${currentSessionIndex}',
      '${totalIssuance}',
      '${activeAccounts}',
      '${new Date().getTime()}'
    );`;
  try {
    await pool.query(sqlInsert);
    logger.info(loggerOptions, `Updating chain info`);
    return true;
  } catch (error) {
    logger.error(loggerOptions, `Error updating chain info`);
    return false;
  }
}

export { start }