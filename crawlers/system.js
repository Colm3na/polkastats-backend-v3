const pino = require('pino');
const { QueryTypes } = require('sequelize');

const logger = pino()

const loggerOptions = {
  crawler: `system`
};

/**
 * Get polkadot node information and store in database
 *
 * @param {object} api             Polkadot API object
 * @param {object} sequelize            Postgres pool object
 */
async function start({api, sequelize, config}) {

  logger.info(loggerOptions, `Starting system crawler`);

  const [blockHeight, chain, nodeName, nodeVersion] = await Promise.all([
    api.derive.chain.bestNumber(),
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  const res = await sequelize.query('SELECT chain, node_name, node_version FROM system ORDER by block_height DESC LIMIT 1', {
    type: QueryTypes.SELECT,
    logging: false,
    plain: true,
    }  
  )
  
  if (res) {
    if (res.chain !== chain || res.node_name !== nodeName || res.node_version !== nodeVersion) {
      await insertRow(sequelize, blockHeight, chain, nodeName, nodeVersion);
    }
  } else {
    await insertRow(sequelize, blockHeight, chain, nodeName, nodeVersion);
  }
}

async function insertRow(sequelize, blockHeight, chain, nodeName, nodeVersion) {
  console.log(blockHeight.toString());
  await sequelize.query(
    `INSERT INTO system (block_height, chain, node_name, node_version, timestamp
    ) VALUES (:block_height, :chain, :node_name, :node_version, :timestamp)`,
    {
      type: QueryTypes.INSERT,
      plain: true,
      replacements: {
        block_height: blockHeight.toString(),
        chain,
        node_name: nodeName,
        node_version: nodeVersion,
        timestamp: new Date().getTime()
      }
    }
  );    
}

module.exports = { start }