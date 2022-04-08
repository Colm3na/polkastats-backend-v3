const { BridgeAPI } = require('../lib/providerAPI/bridgeApi');
const { Logger } = require('../utils/logger');
const blockDB = require('../lib/blockDB.js');
const blockData = require('../lib/blockData.js');
const eventsData = require('../lib/eventsData.js');
const {
  shortHash,
  genArrayRange,
} = require('../utils/utils.js');
const eventsDB = require('../lib/eventsDB.js');
const extrinsic  = require('../lib/extrinsics.js');
const { firstBlock } = require('./../config/config');

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

    const block = getBlockDB[0];
    
    const check = blockData.check({
      sourceBlock: block,
      blockNumber,
      blockInfo
    });    

    if (!check) {
      logger.default(
        `Detected chain reorganizaition at block #${blockNumber}, updating authot, author name, hash ans state root`
      );
      await blockDB.modify({ blockNumber, blockInfo, sequelize });
    }

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

    await extrinsic.save(sequelize,
      blockNumber,
      blockInfo.extrinsics,
      events.blockEvents,
      timestampMs,
      loggerOptions
    );
    
    await eventsData.events(events.blockEvents, async (record, index) => {
      const res = await eventsDB.get({
        blockNumber,
        index,
        sequelize,
      });

      const preEvent = Object.assign(
        {
          block_number: blockNumber,
          event_index: index,
          timestamp: Math.floor(timestampMs / 1000),
        },
        eventsData.parseRecord({ ...record, blockNumber })
      );

      if (!res) {
        await eventsDB.add({ event: preEvent, sequelize });

        logger.info(
          `Added event #${blockNumber}-${index} ${preEvent.section} ➡ ${preEvent.method}`
        );
      }
    });
  }
}

async function getOldBlock({
  firstBlock,
  lastBlock,
  api,
  sequelize,
  logger,
  loggerOptions,
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

async function getLastBlock(api) {
  const bridgeAPI = new BridgeAPI(api).bridgeAPI;
  const result = await blockData.last(bridgeAPI);
  return result;
}

async function start({ api, sequelize, config }) {
  const logger = new Logger();

  logger.start(`Startinf block listner for old blocks...`);

  const blocksGaps = await blockDB.getBlocksGaps({ sequelize });

  if (blocksGaps.length === 0) {
    const blockNumber = await getLastBlock(api);
    await getOldBlock({
      firstBlock,
      lastBlock: blockNumber,
      api,
      sequelize,
      logger,
      loggerOptions,
    });
  }

  for (const item of blocksGaps) {
    const gapStart = Number(item.gapStart);
    const gapEnd = Number(item.gapEnd);

    console.log(gapStart, gapEnd);
    
    await getOldBlock({
      firstBlock: gapStart,
      lastBlock: gapEnd,
      api,
      sequelize,
      logger,
      loggerOptions,
    });
  }
}

module.exports = { start };
