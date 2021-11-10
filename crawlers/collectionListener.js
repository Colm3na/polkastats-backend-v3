const { result } = require("lodash");
const pino = require("pino");

const { QueryTypes } = require("sequelize");

const collectionDB = require('../lib/collectionDB.js');
const collectionData = require('../lib/collectionData.js');
const { genArrayRange } = require("../utils/utils.js");

const logger = pino();

const loggerOptions = {
  crawler: "collectionListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;


async function getCollections(api, countCollection) {
  const range = genArrayRange(1, (countCollection+1));
  const collections = [];
  for (const item of range) {
    const collection = await collectionData.get(item, api);
    if (collection instanceof Object) {
      if (Object.keys(collection).length !== 0) {
        collections.push({ ...collection });
      }      
    }
  }
  return collections;
}

function parseCollection ( collection ) {
  return {
    owner: collection.owner,
    name: collection.name,
    description: collection.description,
    token_limit: collection.tokenLimit,
    collection_id: collection.collection_id,
    
    offchain_schema: collection.offchainSchema,
    const_chain_schema: collection.constChainSchema,
    variable_on_chain_schema: collection.variableOnChainSchema,

    limits_accout_ownership:  collection.limitsAccoutOwnership,
    limits_sponsore_data_size: collection.limitsSponsoreDataSize, 
    limits_sponsore_data_rate: collection.limitsSponsoreDataRate,    
    owner_can_trasfer: collection.ownerCanTrasfer,
    owner_can_destroy: collection.ownerCanDestroy,

    sponsorship_confirmed: collection.sponsorshipConfirmed,
    schema_version: collection.schemaVersion,
    token_prefix: collection.tokenPrefix,
    mode: collection.mode
  }
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
    //TODO: Refractoring!
    await sequelize.query(
      `UPDATE collections SET owner = :owner, 
      name = :name, description = :description, token_limit = :token_limit, 
      offchain_schema = :offchain_schema,
      const_chain_schema = :const_chain_schema, 
      variable_on_chain_schema = :variable_on_chain_schema,
      limits_accout_ownership = :limits_accout_ownership, 
      limits_sponsore_data_size = :limits_sponsore_data_size, 
      limits_sponsore_data_rate = :limits_sponsore_data_rate,
      owner_can_trasfer = :owner_can_trasfer,
      owner_can_destroy = :owner_can_destroy,
      sponsorship_confirmed = :sponsorship_confirmed,
      schema_version = :schema_version,
      token_prefix = :token_prefix,
      mode = :mode
       WHERE collection_id = :collection_id`,
      {
        type: QueryTypes.UPDATE,
        logging: false,
        replacements: {
          ...parseCollection(collection)
        },
      }
    );
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
      await collectionDB.add(collection, sequelize);
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

async function deleteCollection(collectionId, sequelize) {
  await sequelize.query(
    "DELETE FROM tokens WHERE collection_id = :collection_id",
    {
      type: QueryTypes.DELETE,
      logging: false,
      replacements: {
        collection_id: collectionId,
      },
    }
  );

  await sequelize.query(
    "DELETE FROM collections WHERE collection_id = :collection_id",
    {
      type: QueryTypes.DELETE,
      logging: false,
      replacements: {
        collection_id: collectionId,
      },
    }
  );
}

async function getCollectionCount(api) {
  const createdCollectionCount = (
    await api.query.nft.createdCollectionCount()
  ).toNumber();
  return createdCollectionCount;
}

async function start({ api, sequelize, config }) {
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS;
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
    setTimeout(() => run(), pollingTime);
  })();
}

module.exports = {  
  getCollections,
  updateCollection,  
  saveCollection,
  deleteCollection,
  start
};
