const { BridgeAPI } = require('../lib/providerAPI/bridgeApi');
const { Logger } = require('../utils/logger');
const blockDB = require('../lib/blockDB.js');
const blockData = require('../lib/blockData.js');
const eventsData = require('../lib/eventsData.js');
const {
  shortHash,
  storeExtrinsics,
  updateTotals,
  genArrayRange
} = require('../utils/utils.js');
const eventsDB = require('../lib/eventsDB.js');
const { QueryTypes } = require("sequelize");

const loggerOptions = {
  crawler: `oldBlockListenr`,
};

async function getBlock({
  api,
  sequelize,
  blockNumber,
  loggerOptions,
  logger,
}) {
  const bridgeAPI = new BridgeAPI(api).bridgeAPI;

  const blockInfo = await blockData.get({
    blockNumber,
    bridgeAPI,
  });

  const getBlockDB = await blockDB.get({
    blockNumber,
    sequelize,
  });

  if (getBlockDB.length > 0) {
    logger.default(`Detected chain reorganizaition at block #${blockNumber}, updating authot, author name, hash ans state root`);
    await blockDB.modify({ blockNumber, blockInfo, sequelize });
  } else {
    logger.info(
      `Adding block #${blockNumber} (${shortHash(
        blockInfo.blockHash.toString()
      )})`
    );

    const events = await eventsData.get({
      bridgeAPI,
      blockHash: blockInfo.blockHash,
    });

    const timestampMs = await bridgeAPI.api.query.timestamp.now.at(
      blockInfo.blockHash
    );
    const sessionLength = (
      bridgeAPI.api.consts?.babe?.epochDuration || 0
    ).toString();

    await blockDB.add({
      blockNumber,
      block: Object.assign(blockInfo, events, { timestampMs, sessionLength }),
      sequelize,
    });

    await storeExtrinsics(
      sequelize,
      blockNumber,
      blockInfo.extrinsics,
      events.blockEvents,
      loggerOptions
    );

    await eventsData.events(events.blockEvents, async (record, index) => {
      const { event, phase } = record;
      const res = await eventsDB.get({
        blockNumber,
        index,
        sequelize,
      });    

      if (
        !res &&
        event.section !== 'system' &&
        event.method !== 'ExtrinsicSuccess'
      ) {
        await sequelize.query(
          `INSERT INTO event (block_number,event_index, section, method, phase, data)
          VALUES (:block_number,:event_index, :section, :method, :phase, :data);`,
          {
            type: QueryTypes.INSERT,
            logging: false,
            replacements: {
              block_number: blockNumber,
              event_index: index,
              section: event.section,
              method: event.method,
              phase: phase.toString(),
              data: JSON.stringify(event.data),
            },
          }
        );      
        logger.info(
          `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`
        );
      }
    });
  }
  updateTotals(sequelize, loggerOptions);
}

async function getOldBlock({
  firstBlock, lastBlock, api, sequelize, logger, loggerOptions
}) {

  const range = genArrayRange(firstBlock, lastBlock);  

  for (const item of range) {
    await getBlock({
       api,
       sequelize,
       blockNumber: item,
       loggerOptions,
       logger,
     });
   }
}

async function start({ api, sequelize, config }) {
  const logger = new Logger();

  logger.start(`Startinf block listner for old blocks...`);
  const blockNumber = await blockDB.firstBlock(sequelize);
  
  await getOldBlock({
    firstBlock: 1,
    lastBlock: blockNumber,
    api,
    sequelize,
    logger,
    loggerOptions
  });  
}

module.exports = { start };
