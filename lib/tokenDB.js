const { QueryTypes, Sequelize } = require('sequelize');
const collectionStatsDB = require('./collectionsStatsDB');

const statusToken = Object.freeze({
  INSERT: 'insert',
  UPDATE: 'update',
  NOTHING: 'nothing'
});

async function get({
  collectionId,
  tokenId,
  selectList = ['owner', 'data'],
  sequelize
}) {
   function prepareToken(tokenId, collectionId) {
     let result = {};
     result.where = 'collection_id = :collection_id ';
     result.query = {
      type: QueryTypes.SELECT,
      plain: false,
      logging: false,
      replacements: {
        token_id: tokenId,
        collection_id: collectionId
      },
     };
     if (tokenId) {
       result.where = `${result.where} and token_id = :token_id`;
       result.query.plain = true;
     }
     return result;
   }
   const prepare = prepareToken(tokenId, collectionId);

   const result = await sequelize.query(
     `SELECT ${selectList.join(",")} FROM tokens WHERE ${prepare.where}`,
     {
       ...prepare.query
     }
   )
   return result;
}

/**
 * 
 * @param {Object} aToken 
 * @param {Sequelize} sequelize 
 */
async function isExist (aToken, sequelize) {  
  const statement = {
    collectionId: aToken.collectionId,
    tokenId: aToken.tokenId,
    sequelize
  };  
  const res = await get(statement);
  
  let result = statusToken.NOTHING;
  
  if (!res) {
    result = statusToken.INSERT;
  } else {
    if (res.owner !== aToken.owner || res.data !== aToken.constData) {
      result = statusToken.UPDATE;
    }
  }  

  return result;  
}

async function del(aToken, sequelize) {
  
  function prepareToken(aToken) {
    const result = {};
    result.query = {
      type: QueryTypes.DELETE,            
      replacements: {
        token_id: aToken.tokenId,
        collection_id: aToken.collectionId
      },
    };    
    return result;
  }

  const prepare = prepareToken(aToken);

  await collectionStatsDB.decreaseHoldersCount(
    sequelize,
    aToken.collectionId,
    aToken.tokenId,
  );

  await sequelize.query(
    `DELETE FROM tokens WHERE token_id =:token_id and collection_id = :collection_id`,
    {
      ...prepare.query
    }
  );

  await collectionStatsDB.decreaseTokensCount(
    sequelize,
    aToken.collectionId,
  );
}

function setReplacements(aToken) {
  const result = {};
  result.collection_id = aToken.collectionId;
  result.token_id = aToken.tokenId;
  result.data = aToken.constData;
  result.owner = aToken.owner;
  result.date_of_creation = aToken.date_of_creation || null;
  return result;
}

async function add(aToken, sequelize) {
  await collectionStatsDB.increaseHoldersCount(
    sequelize,
    aToken.collectionId,
    aToken.owner,
  );

  await sequelize.query(`INSERT INTO tokens (
    collection_id,
    token_id,
    owner,
    data,
    date_of_creation) VALUES(
      :collection_id,
      :token_id,
      :owner,
      :data,
      :date_of_creation
    )`, {
    type: QueryTypes.INSERT,
    logging: false,
    replacements: setReplacements(aToken)
  });  

  await collectionStatsDB.increaseTokensCount(
    sequelize,
    aToken.collectionId
  );
}

async function modify(aToken, sequelize) {
  const fields = [
    'owner',
    'data',
  ];

  const tokenData = setReplacements(aToken);

  if (tokenData.date_of_creation) {
    fields.push('date_of_creation');
  }

  await collectionStatsDB.decreaseHoldersCount(
    sequelize,
    aToken.collectionId,
    aToken.tokenId,
  );

  await collectionStatsDB.increaseHoldersCount(
    sequelize,
    aToken.collectionId,
    aToken.owner,
  );

  const values = fields.map((field) => `${field} = :${field}`).join(',');

  await sequelize.query(`UPDATE tokens SET ${values} WHERE collection_id = :collection_id and token_id = :token_id`, {
    type: QueryTypes.UPDATE,
    logging: false,
    replacements: tokenData,
  });
}

async function save(aToken, sequelize) {
  const check = await isExist(aToken, sequelize);  
  switch (check) {
    case statusToken.INSERT: 
      await add(aToken, sequelize);
    break;            
    case statusToken.UPDATE:
      await modify(aToken, sequelize);
    break;
  } 
}

async function hasTokenWithoutTimestamp(sequelize) {
  const tokenWithoutTimestamp = await sequelize.query(
    `SELECT id FROM tokens WHERE date_of_creation is null`,
    {
      type: QueryTypes.SELECT,
      plain: true,
      logging: false,
    }
  );
  return Boolean(tokenWithoutTimestamp);
}

async function getCorruptedTokensWithBlockNumber(sequelize) {
  const tokens = await sequelize.query(
    `
    select e.block_number, t.* from tokens t 
    left join "event" e on
    t.collection_id = (e.data::json->>0)::bigint and
    (e.data::json->>1)::int = t.token_id and 
    e."method" = 'ItemCreated'
    where e.block_number is not null and t.date_of_creation is null;
    `,
    {
      type: QueryTypes.SELECT,
      plain: false,
      logging: false,
    }
  );

  return tokens;
}

module.exports = Object.freeze({
  get,
  isExist,
  del,
  add,
  modify,
  save,
  hasTokenWithoutTimestamp,
  getCorruptedTokensWithBlockNumber,
});