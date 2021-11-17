const pino = require('pino');
const logger = pino();

const { genArrayRange, updateTotals } = require('../utils/utils.js');
const protobuf = require('../utils/protobuf.js');

const collectionDB = require('../lib/collectionDB.js');
const tokenData = require('../lib/tokenData.js');
const tokenDB = require('../lib/tokenDB.js');
const { BridgeAPI } = require('../lib/providerAPI/bridgeApi.js');

const loggerOptions = {
  crawler: "tokenListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;


async function getCollections (sequelize) {
  const res = await collectionDB.get({
    selectList: ['collection_id', 'const_chain_schema'],
    sequelize
  });    
  return res.map(enrichCollection)  
}

function enrichCollection(item) {
  const results = {};
  results.collectionId = item.collection_id;
  results.schema = protobuf.getProtoBufRoot(item.const_chain_schema);
  return results;
}

async function* addRange(bridgeAPI, sequelize) {

  const collections = await getCollections(sequelize);    
  
  for (const collection of collections) {
    const tokenCount  = await bridgeAPI.api
      .query
      .nft
      .itemListIndex(collection.collectionId);    

    if (tokenCount !== 0) {
      const result = Object.assign({}, collection);
      result.range = genArrayRange(1, (tokenCount + 1));
      yield result;
    }    
  }   
}

async function* getTokens(bridgeAPI, collection) {  
  for (const item of collection.range) {
    const statement = {
      bridgeAPI,
      collection,
      tokenId: item
    }
    const token = await tokenData.get(statement);

    if (token) {      
      yield token;
    }          
  }
}

async function start({api, sequelize, config}) {
  
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS

  const bridgeAPI = (new BridgeAPI(api)).bridgeAPI;

  logger.info(loggerOptions, "Starting token crawler...");

  (async function run() {    
    try {
      const collections = await addRange(bridgeAPI, sequelize);
      for await (const collection of collections) {
        for await (const token of getTokens(bridgeAPI, collection)) {
          await tokenDB.save(token, sequelize);
        }
      }
    } catch (error) {
      console.error(error)
    }    
    updateTotals(sequelize, loggerOptions)  
    setTimeout(() => run(), pollingTime)
  })()
}

module.exports = {
  start,   
  getCollections,
  addRange
}