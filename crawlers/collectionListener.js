const pino = require("pino");
const { QueryTypes } = require("sequelize");
const { bufferToJSON } = require("../lib/utils.js");
const {
  parseHexToString,
  bufferToString,
  genArrayRange,
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
  return ('disabled' in sponsorship) ? null : sponsorship?.confirmed;
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
      description: bufferToString(source?.Description) || null,
      token_limit: source?.Limits.TokenLimit || 0,
      offchain_schema: parseHexToString(source?.OffchainSchema) || null,
      constChainSchema: null,
      variableOnChainSchema: null,
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
    token_limit !== collection.token_limit    
  ) {
    //TODO: Refractoring!
    await sequelize.query(
      `UPDATE collections SET owner = :owner, 
      name = :name, description = :description, token_limit = :token_limit
       WHERE collection_id = :collection_id`,
      {
        type: QueryTypes.UPDATE,
        logging: false,
        replacements: {
          owner: collection.owner,
          name: collection.name,
          description: collection.description,
          token_limit: collection.token_limit,
          collection_id: collection.collection_id          
        },
      }
    );
  }
}

async function insertCollection(collection, sequelize) {
  await sequelize.query(
    `INSERT INTO collections (collection_id, owner, name, description, offchain_schema, 
      token_limit      
    ) VALUES (:collection_id,:owner, :name, :description, :offchain_schema, :token_limit)`,
    {
      type: QueryTypes.INSERT,
      logging: false,
      replacements: {
        collection_id: collection.collection_id,
        owner: collection.owner,
        name: collection.name,
        description: collection.description,
        offchain_schema: collection.offchain_schema,
        token_limit: collection.token_limit        
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
  const res = await sequelize.query(
    `SELECT collection_id, name, description, 
    offchain_schema, token_limit, owner,
    const_chain_schema, variable_on_chain_schema, limits_accout_ownership,
    limits_sponsore_data_size, limits_sponsore_data_rate, owner_can_trasfer,
    owner_can_destroy, sponsorship_confirmed, schema_version,
    token_prefix, mode
    FROM collections WHERE collection_id = :collection_id`,
    {
      type: QueryTypes.SELECT,
      plain: true,
      logging: false,
      replacements: {
        collection_id: collection.collection_id,
      },
    }
  );

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
