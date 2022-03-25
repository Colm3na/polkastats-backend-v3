const { BridgeAPI } = require('../lib/providerAPI/bridgeApi');
const blockData = require('../lib/blockData.js');
const eventsData = require('../lib/eventsData.js');
const eventTypes = require('../lib/eventFactory/type.js');
const tokenDB = require('../lib/tokenDB.js');

async function restoreTokensTimestamp(sequelize, bridgeAPI) {
  const tokens = await tokenDB.getCorruptedTokensWithBlockNumber(sequelize);
  console.log(`Count of tokens without timestamp: ${tokens.length}`);
  tokens.forEach(async (token) => {
    const blockInfo = await blockData.get({
      blockNumber: token.block_number,
      bridgeAPI,
    });

    const timestampMs = await bridgeAPI.api.query.timestamp.now.at(
      blockInfo.blockHash
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
  });
}

async function startCheckAndRepair(bridgeAPI, sequelize) {
  const hasTokenWithoutTimestamp = await tokenDB.hasTokenWithoutTimestamp(sequelize);
  if (hasTokenWithoutTimestamp) {
    console.log('Tokens without timestamp was found.');
    await restoreTokensTimestamp(sequelize, bridgeAPI);
  }
}

async function start({ api, sequelize, config }) {
  const bridgeAPI = new BridgeAPI(api).bridgeAPI;

  setTimeout(() => startCheckAndRepair(bridgeAPI, sequelize), config.pollingTime);
}

module.exports = { start };
