const { BridgeAPI } = require("../lib/providerAPI/bridgeApi");
const { Logger } = require("../utils/logger");
const blockDB = require('../lib/blockDB.js');
const blockData = require('../lib/blockData.js');
const eventsData = require('../lib/eventsData.js');
const { shortHash } = require('../utils/utils.js');

const loggerOptions = {
  crawler: `oldBlockListenr`,
};

async function start({api, sequelize, config}) {

  const logger = new Logger();
  const blockNumber = 1;

  logger.start(`Startinf block listner for old blocks...`);

  const bridgeAPI = new BridgeAPI(api).bridgeAPI;
  
  const blockInfo = await blockData.get({
    blockNumber,
    bridgeAPI,
  })
    
  const getBlockDB = blockDB.get({
    blockNumber,
    sequelize
  });

  if (getBlockDB.length > 0) {
    logger.default(
      `Detected chain reorganizaition at block #${blockNumber},
      updating authot, author name, hash ans state root`
    );
    await blockDB.modify({ blockNumber, blockInfo, sequelize });
  } else {    
    logger.info(
      `Adding block #${blockNumber} (${shortHash(blockInfo.blockHash.toString())})`
    );

    const events = await eventsData.get({ bridgeAPI, blockHash: blockInfo.blockHash });
    const timestampMs = await bridgeAPI.api.query.timestamp.now.at(blockInfo.blockHash);

    console.log(events);

    await  blockDB.add({
      blockNumber,
      block: Object.assign(blockInfo, events, { timestampMs }),
      sequelize
    })

  }  
}

module.exports = { start };