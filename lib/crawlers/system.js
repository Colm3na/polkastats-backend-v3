// @ts-check

const pino = require('pino');
const logger = pino();

/**
 * Get polkadot node information and store in database
 *
 * @param {object} api             Polkadot API object
 * @param {object} pool            Postgres pool object
 * @param {object} config          Configuration object
 */
async function start(api, pool, config) {

  logger.info('Starting system crawler');

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  let sqlSelect = `SELECT chain, node_name, node_version FROM system ORDER by block_height DESC LIMIT 1`;
  const res = await pool.query(sqlSelect);

  if (res) {
    if (
      res.rows[0].chain !== chain ||
      res.rows[0].node_name !== nodeName ||
      res.rows[0].node_version !== nodeVersion
    ) {
      insertRow(pool, chain, nodeName, nodeVersion);
    }
  } else {
    insertRow(pool, chain, nodeName, nodeVersion);
  }
}

async function insertRow(pool, chain, nodeName, nodeVersion) {
  const sqlInsert = 
    `INSERT INTO system (
      chain,
      node_name,
      node_version,
      timestamp
    ) VALUES (
      '${chain}',
      '${nodeName}',
      '${nodeVersion}',
      '${new Date().getTime()}'
    );`;
  try {
    await pool.query(sqlInsert);
    logger.info('Updating system info');
    return true;
  } catch (error) {
    logger.error('Error updating system info');
    return false;
  }
}

module.exports = { start };
