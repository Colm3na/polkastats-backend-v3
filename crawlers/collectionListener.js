const { result } = require("lodash");
const pino = require("pino");
const { BridgeAPI } = require('../lib/providerAPI/bridgeApi.js');

const { QueryTypes } = require("sequelize");

const collectionDB = require('../lib/collectionDB.js');
const collectionData = require('../lib/collectionData.js');
const { genArrayRange } = require("../utils/utils.js");

const logger = pino();

const loggerOptions = {
  crawler: "collectionListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;


async function getCollections(bridgeAPI, countCollection) {
  const range = genArrayRange(1, (countCollection+1));
  const collections = [];
  for (const item of range) {
    const collection = await collectionData.get(item, bridgeAPI);
    if (Object.keys(collection).length !== 0) {      
        collections.push({ ...collection });      
    }
  }
  return collections;
}

async function updateCollection({
  name,
  description,
  token_limit,
  collection,
  sequelize,
}) {
  if (
    name !== collection.name ||
    description !== collection.description ||
    token_limit !== collection.tokenLimit ||
    token_prefix !== collection.tokenPrefix
  ) {
    await collectionDB.modify({
      collection, sequelize
    });
  }
}

async function setExcaption(sequelize, error, collectionId) {
  logger.error(loggerOptions, `Error setting collection ${collectionId}`);
  await sequelize.query(
    `INSERT INTO harvester_error (block_number, error, timestamp) VALUES (:block_number, :error, :timestamp)`,
    {
      type: QueryTypes.INSERT,
      replacements: {
        block_number: 0,
        error: error.toString().replace(/'/g, "''"),
        timestamp: new Date().getTime(),
      },
    }
  );
}

async function saveCollection({ collection, sequelize }) {
  const res = await collectionDB.get({
    collectionId: collection.collection_id,
    sequelize
  });

  if (!res) {
    try {
      await collectionDB.add({collection, sequelize});
    } catch (error) {
      await setExcaption(sequelize, error, collection.collection_id);
    }
  } else {
    await updateCollection({
      ...res,
      collection,
      sequelize,
    });
  }  
  return result;
}

async function getCollectionCount(bridgeAPI) {
  const createdCollectionCount = (
    await bridgeAPI.api.query.nft.createdCollectionCount()
  ).toNumber();
  return createdCollectionCount;
}

async function start({ api, sequelize, config }) {

  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS;

  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;

  logger.info(loggerOptions, "Starting collection crawler...");  

  (async function run() {
    const countCollection = await bridgeAPI.getCollectionCount();
    console.log(countCollection);
    const collections = await getCollections(bridgeAPI, countCollection);
    for (const item of collections) {      
      await saveCollection({
        collection: item,
        sequelize,
      });
    }
    setTimeout(() => run(), pollingTime);
  })();
}

module.exports = {  
  getCollections,
  updateCollection,  
  saveCollection,  
  start
};
