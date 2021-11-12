const { QueryTypes, Sequelize } = require('sequelize');

const statusToken = {
  INSERT: 'insert',
  UPDATE: 'update',
  NOTHING: 'nothing'
}

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

  await sequelize.query(
    `DELETE FROM tokens WHERE token_id =:token_id and collection_id = :collection_id`,
    {
      ...prepare.query
    }
  );
}

function setReplacements(aToken) {
  const result = {};
  result.collection_id = aToken.collectionId;
  result.token_id = aToken.tokenId;
  result.data = aToken.constData;
  result.owner = aToken.owner;
  return result;
}

async function add(aToken, sequelize) {
  await sequelize.query(`INSERT INTO tokens (collection_id, token_id, owner, data) VALUES(:collection_id, :token_id, :owner, :data)`, {
    type: QueryTypes.INSERT,
    replacements: setReplacements(aToken)
  });  
}

async function modify(aToken, sequelize) {
  await sequelize.query(`UPDATE tokens SET owner = :owner, data = :data WHERE collection_id = :collection_id and token_id = :token_id`, {
    type: QueryTypes.UPDATE,
    //logging: true,
    replacements: setReplacements(aToken)
  })  
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

module.exports = Object.freeze({
  get,
  isExist,
  del,
  add,
  modify,
  save,
});