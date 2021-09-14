const pino = require('pino')
const { parseHexToString, bufferToString, updateTotals } = require('../utils.js')
const logger = pino()

const loggerOptions = {
  crawler: 'collectionListener'
}

const genArrayRange = (min, max) =>
  Array.from(
    { length: max - min },
    (_, i) => i + ((min === 0 ? -1 : min - 1) + 1)
  );

const getCollection = async function(api, collectionId)  {
  const source = (await api.query.nft.collectionById(collectionId)).toJSON();
  let collection = null
  if (source instanceof Object) {    
    const {Owner, Name, Description, OffchainSchema, Limits } = source
    collection = {
      collection_id: collectionId,
      owner: Owner,
      name: bufferToString(Name),
      description: bufferToString(Description),
      token_limit: Limits.TokenLimit,
      offchain_schema: parseHexToString(OffchainSchema)
    }    
  }
  return collection;
}

const getCollections = async function (api, countCollection) {
  const range = genArrayRange(1, countCollection);
  const collections = [];
  for (const item of range) {
     const collection = await getCollection(api, item)
     if (collection instanceof Object) {        
        collections.push({ ...collection})
     }         
  }
  return collections;
}

const setExcaption = async function () {
  
}

const genCollections = async function* (collections) {
  for (item of collections) {
    yield item;
  }
}

const saveCollection = async function({collection, api, pool}) {
  const checkSQL = `SELECT collection_id FROM collection WHERE collection_id = ${collection.collection_id}`

  const res = await pool.query(checkSQL);

  if (res.rows.length === 0) {
    try {

    } catch (error) {
      logger.error(loggerOptions, `Error setting collection ${collection.collection_id}`);
      try {
        const timestamp = new Date().getTime();
        const errorString = error.toString().replace(/'/g, "''");
        const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
          VALUES ('${0}', '${errorString}', '${timestamp}');
        `;
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting error for collectionId #${collection.collection_id} in harvester_error table :-/ : ${error}`);
      }
    }
  } else {

  }
}

const getCollectionCount = async function(api) {
  const createdCollectionCount = (await api.query.nft.createdCollectionCount()).toNumber()  
  return createdCollectionCount
}

const start = async function(api, pool, config) {
  logger.info(loggerOptions, 'Starting collection crawler...');
  
  const countCollection = await getCollectionCount(api)
  const collections = await getCollections(api, countCollection)  

  for await (const item of genCollections(collections)) {        
    await saveCollection({
      collection: item,
      api,
      pool
    })
  }

  //updateTotals(pool, loggerOptions)

}

module.exports = { start }