const pino = require('pino');
const logger = pino();

const { genArrayRange, updateTotals } = require('../utils/utils.js');
const protobuf = require('../utils/protobuf.js');

const collectionDB = require('../lib/collectionDB.js');
const tokenData = require('../lib/tokenData.js');
const tokenDB = require('../lib/tokenDB.js');

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

async function* addRange(api, sequelize) {

  const collections = await getCollections(sequelize);    
  
  for (const collection of collections) {
    const tokenCount  = await api.query.nft.itemListIndex(collection.collectionId);    
    if (tokenCount !== 0) {
      const result = Object.assign({}, collection);
      result.range = genArrayRange(1, (tokenCount + 1));
      yield result;
    }    
  }   
}

async function getToken({
  api, collection, tokenId 
}) {  
  let token = await api.query.nft.nftItemList(
    collection.collectionId, 
    tokenId
  );  
  return tokenData.get(
    Object.assign(tokenData.toObject(token), { 
      collectionId: collection.collectionId,
      tokenId,
      schema: collection.schema
    })
  );
}

async function* getTokens(api, collection) {  
  for (const item of collection.range) {
    const statement = {
      api,
      collection,
      tokenId: item
    }
    const token = await getToken(statement); 

    if (token) {      
      yield token;
    }          
  }
}

async function start({api, sequelize, config}) {
  
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS
  logger.info(loggerOptions, "Starting token crawler...");

  (async function run() {    
    try {
      const collections = await addRange(api, sequelize);      
      for await (const collection of collections) {                
        for await (const token of getTokens(api, collection)) {          
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
  getToken,  
  getCollections,
  addRange
}