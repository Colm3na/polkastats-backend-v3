const pino = require('pino');
const {
  shortHash,
  updateTotals,
} = require('../utils/utils.js');

const { EventFacade } = require('./eventFacade.js');
const { BridgeAPI } = require('../lib/providerAPI/bridgeApi.js');

const extrinsic = require('../lib/extrinsics.js');
const eventsData = require('../lib/eventsData.js');
const eventsDB = require('../lib/eventsDB.js');
const blockDB = require('../lib/blockDB.js');
const blockData = require('../lib/blockData.js');



const logger = pino();
const loggerOptions = {
  crawler: `blockListener`,
};

async function start({ api, sequelize, config }) {
  logger.info(loggerOptions, `Starting block listener...`);

  const bridgeAPI = new BridgeAPI(api).bridgeAPI;

  await bridgeAPI.api.rpc.chain.subscribeNewHeads(async (header) => {
    logger.info(`last block #${header.number} has hash ${header.hash}`);

    const blockNumber = header.number.toNumber();

    const blockInfo = await blockData.get({
      blockNumber,
      bridgeAPI,
    });

    let res = await blockDB.get({ blockNumber, sequelize });

    // Handle chain reorganizations

    if (res.length > 0) {
      // Chain reorganization detected! We need to update block_author, block_hash and state_root
      const block = res[0];
      const check = blockData.check({
        sourceBlock: block,
        blockNumber,
        blockInfo
      });

      if (!check) {
        logger.info(
          loggerOptions,
          `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`
        );
        await blockDB.modify({ blockNumber, blockInfo, sequelize });
      }
    } else {
      // Get block events
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

      // Store new block
      logger.info(
        loggerOptions,
        `Adding block #${blockNumber} (${shortHash(
          blockInfo.blockHash.toString()
        )})`
      );

      await blockDB.add({
        blockNumber,
        block: Object.assign(blockInfo, events, { timestampMs, sessionLength }),
        sequelize,
      });

      // Store block extrinsics
      await extrinsic.save(      
        sequelize,
        blockNumber,
        blockInfo.extrinsics,
        events.blockEvents,
        timestampMs,
        loggerOptions
      );

      const eventFacade = new EventFacade(bridgeAPI, sequelize);
      // Loop through the Vec<EventRecord>
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

          if (preEvent.section !== 'balances') {
            eventFacade.save(preEvent.method, preEvent._event.data.toJSON());
          }
        }
      });
    }
    updateTotals(sequelize, loggerOptions);
  });
}

module.exports = { start };
