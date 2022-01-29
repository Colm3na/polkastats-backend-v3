const { QueryTypes } = require('sequelize');

const statusCollection = Object.freeze({
  INSERT: 'insert',
  UPDATE: 'updated',
  NOTHING: 'nothing'
});


async function get({
  collectionId,
  selectList = [
    'collection_id',
    'name',
    'description',
    'offchain_schema',
    'token_limit, owner',
    'const_chain_schema',
    'variable_on_chain_schema',
    'limits_accout_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_trasfer',
    'owner_can_destroy',
    'sponsorship_confirmed',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
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

function parseData (collection) {
  const result = {};
  
  result.collection_id = collection.collection_id;
  result.owner = collection.owner;
  result.name = collection.name;
  result.description = collection.description;
  result.sponsorship_confirmed = collection.sponsorshipConfirmed;
  result.token_prefix = collection.tokenPrefix;
  result.mode = collection.mode;
  result.mint_mode = collection.mint_mode;

  return Object.assign(result, 
      getLimits(collection),
      getSchema(collection)
    );

  function getLimits(collection) {
    const result = {};
    result.token_limit = collection.tokenLimit;
    result.limits_accout_ownership = collection.limitsAccoutOwnership;
    result.limits_sponsore_data_size = collection.limitsSponsoreDataSize;
    result.limits_sponsore_data_rate = collection.limitsSponsoreDataRate;
    result.owner_can_trasfer = collection.ownerCanTrasfer;
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
    'limits_accout_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_trasfer',
    'owner_can_destroy',
    'sponsorship_confirmed',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
]}) {  
  
  const values = insertList.map((item) => `:${item}`).join(',');

  await sequelize.query(
    `INSERT INTO collections (${insertList.join(',')}) VALUES (${values})`, {
      ...prepareCollection(collection, QueryTypes.INSERT)
    }
  )
}

async function del(collectionId, sequelize) {
  
  function getPrepareCollection (collectionId) {
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
      ...getPrepareCollection(collectionId)
    });
  }  
}

async function modify({
  collection, 
  sequelize,
  updateList = [
    'owner',
    'name',
    'description',
    'token_limit',
    'offchain_schema',
    'const_chain_schema',
    'variable_on_chain_schema',
    'limits_accout_ownership',
    'limits_sponsore_data_size',
    'limits_sponsore_data_rate',
    'owner_can_trasfer',
    'owner_can_destroy',
    'sponsorship_confirmed',
    'schema_version',
    'token_prefix',
    'mode',
    'mint_mode',
  ]
}) {
  const values = updateList.map((item) => `${item} = :${item}`).join(',');

  await sequelize.query(
    `UPDATE collections SET ${values} WHERE collection_id = :collection_id`,
    {
      ...prepareCollection(collection, QueryTypes.UPDATE)
    });
}

async function isExist(aCollection, sequelize) {

}

async function save(aCollection, sequelize) {

}

module.exports = Object.freeze({
  get,
  add,
  del,
  modify,
});
