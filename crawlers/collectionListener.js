import Sequelize from 'sequelize'
import pino from 'pino'
import { parseHexToString,
  bufferToString,
  genArrayRange } from '../utils/utils.js'

const logger = pino()
const { QueryTypes } = Sequelize

const loggerOptions = {
  crawler: "collectionListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

export async function getCollection (api, collectionId) {  
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

async function getCollections (api, countCollection) {
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

export async function updateCollection ({
  name, description, token_limit, collection, sequelize
}) {    
  if (name !== collection.name  || description !== collection.description || token_limit !== collection.token_limit) {    

    await sequelize.query(
      `UPDATE collections SET owner = :owner, name = :name, description = :description, token_limit = :token_limit WHERE collection_id = :collection_id`, {
        type: QueryTypes.UPDATE,
        logging: false,
        replacements: {
          owner: collection.owner,
          name:collection.name,
          description: collection.description,
          token_limit: collection.token_limit, 
          collection_id: collection.collection_id
        }
      }
    )
  }
}

export async function insertCollection (collection, sequelize) {
  await sequelize.query(
    `INSERT INTO collections (collection_id, owner, name, description, offchain_schema, token_limit
    ) VALUES (:collection_id,:owner, :name, :description, :offchain_schema, :token_limit)`, {
      type: QueryTypes.INSERT,      
      logging: false,
      replacements: {
        collection_id: collection.collection_id,
        owner: collection.owner, 
        name:collection.name,
        description: collection.description,
        offchain_schema: collection.offchain_schema,
        token_limit: collection.token_limit
      }
    }
  )  
};

export async function setExcaption(sequelize, error, collectionId) {
  logger.error(loggerOptions, `Error setting collection ${collectionId}`);
  await sequelize.query(
    `INSERT INTO harvester_error (block_number, error, timestamp) VALUES (:block_number, :error, :timestamp)`, {
      type: QueryTypes.INSERT,
      replacements: {
        block_number: 0,
        error: error.toString().replace(/'/g, "''"),
        timestamp: new Date().getTime()
      }
    }
  )  
};

export async function saveCollection ({ collection, sequelize }) {  
  const res = await sequelize.query(
    'SELECT collection_id, name, description, offchain_schema, token_limit, owner FROM collections WHERE collection_id = :collection_id', {
      type: QueryTypes.SELECT,
      plain: true,
      logging: false,
      replacements: {
        collection_id: collection.collection_id
      }
    }
  );

  if (!res) {    
    try {
      await insertCollection(collection, sequelize)
    } catch (error) {
      await setExcaption(sequelize, error, collection.collection_id);
    }
  } else {            
    await updateCollection({
      ...res, 
      collection, 
      sequelize
    });    
  }
};

export async function deleteCollection (collectionId, sequelize) {

  await sequelize.query(
    'DELETE FROM tokens WHERE collection_id = :collection_id', {
      type: QueryTypes.DELETE,
      logging: false,
      replacements: {
        collection_id: collectionId
      }
    }
  )

  await sequelize.query(
    'DELETE FROM collections WHERE collection_id = :collection_id', {
      type: QueryTypes.DELETE,
      logging: false,
      replacements: {
        collection_id: collectionId
      }
    }
  )
}

export async function getCollectionCount (api) {
  const createdCollectionCount = (
    await api.query.nft.createdCollectionCount()
  ).toNumber();  
  return createdCollectionCount;
};

export async function start ({api, sequelize, config}) {  
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS  
  logger.info(loggerOptions, "Starting collection crawler..."); 
  (async function run() {
    const countCollection = await getCollectionCount(api);    
    const collections = await getCollections(api, countCollection);    
      for (const item of collections) {
        await saveCollection({
          collection: item,      
          sequelize,
        });
      }
      setTimeout(() => run(), pollingTime)    
  })();  
}