const { result } = require("lodash");
const pino = require("pino");
const { QueryTypes } = require("sequelize");
const utilsCollection = require('../lib/collections.js');
const {
  parseHexToString,
  bufferToString,
  genArrayRange,
  bufferToJSON,
} = require("../utils/utils.js");

const logger = pino();

const loggerOptions = {
  crawler: "collectionListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

/**
 * Get sponsorship
 * @param {*} sponsorship 
 * @returns {string | null}
 */
function getSponsorshipConfirmed(sponsorship) {    
  return ('disabled' in sponsorship) ? null : JSON.stringify(sponsorship);
}

async function getCollection(api, collectionId) {
  let source = await api.query.nft.collectionById(collectionId);
  if (!("Owner" in source)) {
    source = source.toJSON();
  }
  let collection = null;

  if (source instanceof Object) {        
    const limits = source?.Limits || {};

    collection = {
      collection_id: collectionId,
      owner: source?.Owner,
      name: bufferToString(source?.Name),
      description: bufferToString(source?.Description),
      tokenLimit: source?.Limits.TokenLimit || 0,
      offchainSchema: parseHexToString(source?.OffchainSchema),
      constChainSchema: bufferToJSON(source?.ConstOnChainSchema),
      variableOnChainSchema: bufferToJSON(source?.VariableOnChainSchema),
      limitsAccoutOwnership: limits.AccountTokenOwnershipLimit || 0,  
      limitsSponsoreDataSize: limits.SponsoredDataSize,
      limitsSponsoreDataRate: limits.SponsoredDataRateLimit,
      ownerCanTrasfer: limits.OwnerCanTransfer,
      ownerCanDestroy: limits.OwnerCanDestroy,
      sponsorshipConfirmed: getSponsorshipConfirmed(source?.Sponsorship),
      schemaVersion: source?.SchemaVersion,
      tokenPrefix: parseHexToString(source?.TokenPrefix),
      mode: JSON.stringify(source?.Mode)
    };
  }
  return collection;
}


async function getCollections(api, countCollection) {
  const range = genArrayRange(1, (countCollection+1));
  const collections = [];
  for (const item of range) {
    const collection = await getCollection(api, item);
    if (collection instanceof Object) {
      collections.push({ ...collection });
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

async function insertCollection(collection, sequelize) {  
  await sequelize.query(
    `INSERT INTO collections (collection_id, owner, name, description, offchain_schema, 
      token_limit,
      const_chain_schema,
      variable_on_chain_schema,
      limits_accout_ownership,
      limits_sponsore_data_size,
      limits_sponsore_data_rate,
      owner_can_trasfer,
      owner_can_destroy,
      sponsorship_confirmed,
      schema_version,
      token_prefix,
      mode
    ) VALUES (:collection_id,:owner, :name, :description, :offchain_schema, :token_limit,
      :const_chain_schema,
      :variable_on_chain_schema,
      :limits_accout_ownership,
      :limits_sponsore_data_size,
      :limits_sponsore_data_rate,
      :owner_can_trasfer,
      :owner_can_destroy,
      :sponsorship_confirmed,
      :schema_version,
      :token_prefix,
      :mode)`,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: {
        collection_id: collection.collection_id,
        ...parseCollection(collection)
      },
    }
  );
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
  const res = await utilsCollection.get({
    collectionId: collection.collection_id,
    sequelize
  });

  if (!res) {
    try {
      await insertCollection(collection, sequelize);
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
  getCollection,
  getCollections,
  updateCollection,
  insertCollection,
  saveCollection,
  deleteCollection,
  start
};
