const { QueryTypes } = require('sequelize');

const statusCollection = Object.freeze({
  INSERT: 'insert',
  UPDATE: 'updated',
  NOTHING: 'nothing'
});


async function get({
  collectionId = null,
  selectList = [
    'collection_id',
    'name',
    'description',
    'offchain_schema',
    'token_limit, owner',
    'const_chain_schema',
    'variable_on_chain_schema',
    'limits_account_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_transfer',
    'owner_can_destroy',
    'sponsorship',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
    'date_of_creation',
  ],
  sequelize,
}) {
  function prepareCollection(collectionId) {
    const result = {
      where: '',
      query: {
        type: QueryTypes.SELECT,
        plain: false,
        logging: false,
        replacements: {
          collection_id: collectionId,
        },
      },
    };
    if (collectionId) {
      result.where = 'WHERE collection_id = :collection_id';
      result.query.plain = true;
    }
    return result;
  }
  const prepare = prepareCollection(collectionId);

  const result = await sequelize.query(
    `SELECT ${selectList.join(',')} FROM collections ${prepare.where}`,
    {
      ...prepare.query,
    }
  );
  return result;
}

function parseData(collection) {
  const result = {};

  result.collection_id = collection.collection_id;
  result.owner = collection.owner;
  result.name = collection.name;
  result.description = collection.description;
  result.sponsorship = collection.sponsorship;
  result.token_prefix = collection.tokenPrefix;
  result.mode = collection.mode;
  result.mint_mode = collection.mint_mode;
  result.date_of_creation = collection.date_of_creation || null;

  return Object.assign(result,
    getLimits(collection),
    getSchema(collection)
  );

  function getLimits(collection) {
    const result = {};
    result.token_limit = collection.tokenLimit;
    result.limits_account_ownership = collection.limitsAccountOwnership;
    result.limits_sponsore_data_size = collection.limitsSponsoreDataSize;
    result.limits_sponsore_data_rate = collection.limitsSponsoreDataRate;
    result.owner_can_transfer = collection.ownerCanTransfer;
    result.owner_can_destroy = collection.ownerCanDestroy;
    return result;
  }

  function getSchema(collection) {
    const result = {};
    result.offchain_schema = collection.offchainSchema;
    result.const_chain_schema = collection.constChainSchema;
    result.variable_on_chain_schema = collection.variableOnChainSchema;
    result.schema_version = collection.schemaVersion;
    return result;
  }
}

function prepareCollection(collection, type) {
  const result = {};

  result.type = type;
  result.logging = false;
  result.replacements = {
    ...parseData(collection)
  }
  return result;
}

async function add({
  collection,
  sequelize,
  insertList = [
    'collection_id',
    'owner',
    'name',
    'description',
    'offchain_schema',
    'token_limit',
    'const_chain_schema',
    'variable_on_chain_schema',
    'limits_account_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_transfer',
    'owner_can_destroy',
    'sponsorship',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
    'date_of_creation',
  ],
}) {

  const values = insertList.map((item) => `:${item}`).join(',');

  await sequelize.query(
    `INSERT INTO collections (${insertList.join(',')}) VALUES (${values})`, {
    ...prepareCollection(collection, QueryTypes.INSERT)
  }
  )
}

async function del(collectionId, sequelize, transaction = null) {

  function getPrepareCollection(collectionId) {
    const result = {};
    result.type = QueryTypes.DELETE;
    result.logging = false;
    result.replacements = {
      collection_id: collectionId
    };
    return result;
  }

  const lists = [
    `DELETE FROM tokens WHERE collection_id = :collection_id`,
    `DELETE FROM collections WHERE collection_id = :collection_id`,
  ];

  for (const query of lists) {
    await sequelize.query(query, {
      ...getPrepareCollection(collectionId),
      transaction,
    });
  }
}

async function save({
  collection,
  sequelize,
  fields = [
    'collection_id',
    'owner',
    'name',
    'description',
    'offchain_schema',
    'token_limit',
    'const_chain_schema',
    'variable_on_chain_schema',
    'limits_account_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_transfer',
    'owner_can_destroy',
    'sponsorship',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
    'date_of_creation',
  ],
  transaction = null,
  excludeFields = [],
}) {
  const queryFields = fields.filter((field) => !excludeFields.includes(field));
  const updateFields = queryFields.map((item) => `${item} = :${item}`).join(',');
  const values = queryFields.map((item) => `:${item}`).join(',');
  const query = `
    INSERT INTO collections (${queryFields.join(',')}) VALUES (${values})
    ON CONFLICT ON CONSTRAINT collections_pkey
    DO UPDATE SET ${updateFields};
  `;
  await sequelize.query(
    query,
    {
      ...prepareCollection(collection, QueryTypes.UPDATE),
      transaction,
    },
  );
}

async function isExist(aCollection, sequelize) {

}

module.exports = Object.freeze({
  get,
  add,
  del,
  save,
});
