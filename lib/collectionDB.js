const { QueryTypes } = require("sequelize");

const statusCollection = {
  INSERT: 'insert',
  UPDATE: 'updated',
  NOTHING: 'nothing'
}


async function get({
  collectionId,
  selectList = [
    "collection_id",
    "name",
    "description",
    "offchain_schema",
    "token_limit, owner",
    "const_chain_schema",
    "variable_on_chain_schema",
    "limits_accout_ownership",
    "limits_sponsore_data_size",
    "limits_sponsore_data_rate",
    "owner_can_trasfer",
    "owner_can_destroy",
    "sponsorship_confirmed",
    "schema_version",
    "token_prefix",
    "mode",
  ],
  sequelize,
}) {
  function prepareCollection(collectionId) {
    const result = {
      where: "",
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
      result.where = "WHERE collection_id = :collection_id";
      result.query.plain = true;
    }
    return result;
  }
  const prepare = prepareCollection(collectionId);

  const result = await sequelize.query(
    `SELECT ${selectList.join(",")} FROM collections ${prepare.where}`,
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

async function add(collection, sequelize) {  
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
      :mode)`, {
      ...prepareCollection(collection, QueryTypes.INSERT)
    }
  )
}

async function del(aCollection, sequelize) {

}

async function modify(aCollection, sequelize) {

}

async function isExist(aCollection, sequelize) {

}

async function save(aCollection, sequelize) {

}

module.exports = Object.freeze({
  get,
  add,
});
