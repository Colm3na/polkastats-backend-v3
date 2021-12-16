const pino = require('pino');
const {
  shortHash,
  storeExtrinsics,
  updateTotals,
} = require('../utils/utils.js');

const { EventFacade } = require('./eventFacade.js');
const { QueryTypes } = require("sequelize");
const eventsData = require('../lib/eventsData.js');
const eventsDB = require('../lib/eventsDB.js');
const blockDB = require('../lib/blockDB.js');
const blockData = require('../lib/blockData.js');

const { BridgeAPI } = require('../lib/providerAPI/bridgeApi.js');

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
      logger.info(
        loggerOptions,
        `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`
      );

      await blockDB.modify({ blockNumber, blockInfo, sequelize });
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
      await storeExtrinsics(
        sequelize,
        blockNumber,
        blockInfo.extrinsics,
        events.blockEvents,
        timestampMs,
        loggerOptions,
      );

      const eventFacade = new EventFacade(bridgeAPI, sequelize);
      // Loop through the Vec<EventRecord>
      await eventsData.events(events.blockEvents, async (record, index) => {
        const { event, phase } = record;
        const res = await eventsDB.get({
          blockNumber,
          index,
          sequelize,
        });

        let amount = 0;

        if (
          !res &&
          event.section !== 'system' &&
          event.method !== 'ExtrinsicSuccess'
        ) {
          if (event.section === 'balances' && event.method === 'Transfer') {
            amount = Number(event.data[2].toString().replace('000000000000000000',''));
          }
          await sequelize.query(
            `INSERT INTO event (block_number,event_index, section, method, phase, data, timestamp, amount)
            VALUES (:block_number,:event_index, :section, :method, :phase, :data, :timestamp, :amount)`,
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
                timestamp: Math.floor(timestampMs / 1000),
                amount
              },
            }
          );

          logger.info(
            `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`
          );

          if (event.section !== 'balances') {
            eventFacade.save(event.method, event.data.toJSON());
          }

        }
      });
    }
    updateTotals(sequelize, loggerOptions);
  });
}

module.exports = { start };
