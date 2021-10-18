import Sequelize from 'sequelize'
import pino from 'pino'

const logger = pino()
const { QueryTypes } = Sequelize

const loggerOptions = {
  crawler: `chain`
};



async function getTotalActiveAccounts(api) {
  const accountKeys = await api.query.system.account.keys()
  const accounts = accountKeys.map(key => key.args[0].toHuman());
  return accounts.length || 0;
}

async function insertRow({sequelize, blockHeight, currentSessionIndex, totalIssuance, activeAccounts}) {
  const res = await sequelize.query(
    `INSERT INTO chain (
      block_height, session_index, total_issuance, active_accounts, timestamp
    ) VALUES (:block_height, :session_index, :total_issuance, :active_accounts, :timestamp);`, {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: {        
        block_height: blockHeight, 
        session_index: currentSessionIndex, 
        total_issuance: totalIssuance, 
        active_accounts: activeAccounts, 
        timestamp: new Date().getTime()
      }
    }
  )
  if (res) {
    logger.info(loggerOptions, `Updating chain info`);
    return true
  } else {
    return false
  }  
}

export async function start({api, sequelize, config}) {
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

      const res = await sequelize.query('SELECT session_index FROM chain ORDER by session_index DESC LIMIT 1', {
        type: QueryTypes.SELECT,
        plain: true
      })      
      if (res) {
        const activeAccounts = await getTotalActiveAccounts(api);
        await insertRow({sequelize, blockHeight, currentIndex, totalIssuance, activeAccounts});
      }
      isRunning = false;
    }

  });
}