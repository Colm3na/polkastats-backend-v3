import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';
import { ILoggerOptions } from './../types/type';
import pino from 'pino'
const logger = pino()

const loggerOptions: ILoggerOptions = {
  crawler: 'system'
}

async function insertRow(pool: Pool, blockHeight: any, chain: any, nodeName: any, nodeVersion: any):Promise<boolean> {
  const sqlInsert: string = 
  `INSERT INTO system (
    block_height,
    chain,
    node_name,
    node_version,
    timestamp
  ) VALUES (
    '${blockHeight}',
    '${chain}',
    '${nodeName}',
    '${nodeVersion}',
    '${new Date().getTime()}'
  );`;
try {
  await pool.query(sqlInsert);
  logger.info(loggerOptions, `Updating system info`);
  return true;
} catch (error) {
  logger.error(loggerOptions, `Error updating system info`);
  return false;
}
}

async function start(api: ApiPromise , pool: Pool): Promise<void> {

  logger.info(loggerOptions, `Starting system crawler`);

  const [blockHeight, chain, nodeName, nodeVersion] = await Promise.all([
    api.derive.chain.bestNumber(),
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  let sqlSelect = `SELECT chain, node_name, node_version FROM system ORDER by block_height DESC LIMIT 1`;
  const res = await pool.query(sqlSelect);

  if (res.rows.length > 0) {
    if (
      res.rows[0].chain !== chain ||
      res.rows[0].node_name !== nodeName ||
      res.rows[0].node_version !== nodeVersion
    ) {
      await insertRow(pool, blockHeight, chain, nodeName, nodeVersion);
    }
  } else {
    await insertRow(pool, blockHeight, chain, nodeName, nodeVersion);
  }
}

export { start }