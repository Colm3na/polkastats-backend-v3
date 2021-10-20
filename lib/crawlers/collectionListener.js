const pino = require("pino");
const {
  parseHexToString,
  bufferToString,
  updateTotals,
  genArrayRange,
} = require("../utils.js");
const logger = pino();

const loggerOptions = {
  crawler: "collectionListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

const getCollection = async function (api, collectionId) {  
  let source = await api.query.nft.collectionById(collectionId);    
  if (!('Owner' in source)) {
    source = source.toJSON();
  }    
  let collection = null;
    
  if (source instanceof Object) {
    const { Owner, Name, Description, OffchainSchema, Limits } = source;
    collection = {
      collection_id: collectionId,
      owner: Owner,
      name: bufferToString(Name),
      description: bufferToString(Description),
      token_limit: Limits.TokenLimit,
      offchain_schema: parseHexToString(OffchainSchema),
    };
  }
  return collection;
};

const getCollections = async function (api, countCollection) {
  const range = genArrayRange(1, countCollection);
  const collections = [];
  for (const item of range) {
    const collection = await getCollection(api, item);
    if (collection instanceof Object) {
      collections.push({ ...collection });
    }
  }
  return collections;
};

const setExcaption = async function (pool, error, collectionId) {
  logger.error(loggerOptions, `Error setting collection ${collectionId}`);
  try {
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const sql = `INSERT INTO harvester_error (block_number, error, timestamp) VALUES ('${0}', '${errorString}', '${timestamp}');`;
    await pool.query(sql);
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error inserting error for collectionId #${collectionId} in harvester_error table :-/ : ${error}`
    );
  }
};

const insertCollection = async function (collection, pool) {
  const {collection_id, owner, name, description, token_limit, offchain_schema} = collection;

  const sql = `INSERT INTO collections (
    collection_id,
    owner,
    name,
    description,
    offchain_schema,
    token_limit
  ) VALUES ('${collection_id}','${owner}','${name}','${description}','${offchain_schema}', '${token_limit}');`;  
  await pool.query(sql)
};

const saveCollection = async function ({ collection, pool }) {
  const checkSQL = `SELECT collection_id, name, description, offchain_schema, token_limit, owner FROM collections WHERE collection_id = ${collection.collection_id}`;  
  const res = await pool.query(checkSQL);  
  if (res.rows.length === 0) {
    await insertCollection(collection, pool)
    try {
    } catch (error) {
      await setExcaption(pool, error, collection.collection_id);
    }
  } else {            
    await updateCollection({
      ...res.rows[0], 
      collection, 
      pool
    });    
  }
};

async function updateCollection ({
  name, description, token_limit, collection, pool
}) {    
  if (name !== collection.name  || description !== collection.description || token_limit !== collection.token_limit) {    
    const updateSQL = `UPDATE collections SET owner = '${collection.owner}', 
        name = '${collection.name}', 
        description = '${collection.description}', 
        token_limit = '${collection.token_limit}' 
      WHERE collection_id = ${collection.collection_id}`;      
    await pool.query(updateSQL)
  }
}

async function deleteCollection (collectionId, pool) {

  const deleteTokens = `DELETE FROM tokens WHERE collection_id = ${collectionId}`;
  await pool.query(deleteTokens)

  const deleteCollection = `DELETE FROM collections WHERE collection_id = ${collectionId}`;
  await pool.query(deleteCollection)
}

const getCollectionCount = async function (api) {
  const createdCollectionCount = (
    await api.query.nft.createdCollectionCount()
  ).toNumber();
  console.log(createdCollectionCount);
  return createdCollectionCount;
};

const start = async function (api, pool, config) {
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS
  logger.info(loggerOptions, "Starting collection crawler...");  
  (async function run() {
    const countCollection = await getCollectionCount(api);
    const collections = await getCollections(api, countCollection);
      for (const item of collections) {
        await saveCollection({
          collection: item,      
          pool,
        });
      }
      setTimeout(() => run(), pollingTime)    
  })();  
};

module.exports = {
  start,
  getCollectionCount,
  saveCollection,
  insertCollection,
  getCollections,
  getCollection,
  updateCollection,
  deleteCollection
};