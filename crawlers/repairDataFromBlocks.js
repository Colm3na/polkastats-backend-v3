const { BridgeAPI } = require('../lib/providerAPI/bridgeApi');
const blockData = require('../lib/blockData.js');
const eventsData = require('../lib/eventsData.js');
const eventTypes = require('../lib/eventFactory/type.js');
const tokenDB = require('../lib/tokenDB.js');

let isTokensTimestampRestoreRunning = false;

async function restoreTokensTimestamp(sequelize, bridgeAPI) {
  isTokensTimestampRestoreRunning = true;
  const tokens = await tokenDB.getCorruptedTokensWithBlockNumber(sequelize);
  console.log(`Count of tokens without timestamp: ${tokens.length}`);
  for (const token of tokens) {
    const blockHash = await bridgeAPI.getBlockHash(token.block_number);
    const timestampMs = await bridgeAPI.api.query.timestamp.now.at(
      blockHash,
    );

    await tokenDB.save(
      {
        collectionId: token.collection_id,
        tokenId: token.token_id,
        constData: JSON.stringify(token.data),
        owner: token.owner,
        date_of_creation: timestampMs / 1000,
      },
      sequelize,
    );

    console.log(`Token timestamp was repaired for token number ${token.token_id} in collection ${token.collection_id}.`);
  }
  isTokensTimestampRestoreRunning = false;
}

async function startCheckAndRepair(bridgeAPI, sequelize) {
  const hasTokenWithoutTimestamp = await tokenDB.hasTokenWithoutTimestamp(sequelize);
  if (hasTokenWithoutTimestamp && !isTokensTimestampRestoreRunning) {
    console.log('Tokens without timestamp was found.');
    await restoreTokensTimestamp(sequelize, bridgeAPI);
  }
}

async function start({ api, sequelize, config }) {
  console.log('Repair from block data was started.');
  const bridgeAPI = new BridgeAPI(api).bridgeAPI;
  setInterval(() => startCheckAndRepair(bridgeAPI, sequelize), config.pollingTime);
}

module.exports = { start };
