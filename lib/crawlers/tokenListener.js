const pino = require('pino')
const {
  genArrayRange,
  updateTotals
} = require('../utils.js')
const logger = pino()


const loggerOptions = {
  crawler: "tokenListener",
};

async function getCollectionIds (pool) {
  const sql = `SELECT collection_id FROM collections`;
  const res = await pool.query(sql);    
  return res.rows.map(item => item.collection_id)  
}

 async function getCountTokens(api, collectionId) {
    const count = await api.query.nft.itemListIndex(collectionId);
    return count;
 }

 async function getToken(api, collectionId, tokenId) {   
   const token = (await api.query.nft.nftItemList(collectionId, tokenId)).toJSON();   
   if (token === null) {
     return null
   } else {
    return {
      owner: token?.Owner || null,
      collectionId,
      tokenId
    }
   }   
 }

 async function* getCountEach(api, collectionIds) {    
   for (const collectionId of collectionIds) {
     const count = await getCountTokens(api, collectionId);
     yield {
      collectionId,
      count: count.toNumber()
    }   
 }
}

async function getTokensInDB(pool, collectionId) {
  const sql = `SELECT count(id) as tokens FROM tokens WHERE collection_id === ${collectionId}`;
  const res = await pool.query(sql);
  if (res.rows.length === 0) {
    return 0
  } else {
    return res.rows[0].tokens
  }
}

async function checkTokens(pool, {owner, collectionId, tokenId}) {
  const checkSQL = `SELECT owner FROM tokens WHERE collection_id = ${collectionId} 
  and token_id = ${tokenId}`
  const res = await pool.query(checkSQL);

  if (res.rows.length === 0) {
    return 'insert';
  } else {    
    if (res.rows[0].owner === owner) {
      return 'update';
    } else {
      return null
    }
  }
}

async function* getTokens(api, pool, collectionId, count) {
  const range = genArrayRange(1, count);
  for (const item of range) {
    const token = await getToken(api, collectionId, item); 

    if (token) {
      const check = await checkTokens(pool, {
        owner: token.owner,
        collectionId: token.collectionId,
        tokenId: item
      })

      if (check) {
        yield {
          ...token,
          check
        }
      }

    }             
  }
}

async function saveToken(pool, token) {
  const {owner, collectionId, tokenId, check} = token;
  if (check === 'insert') {
    const insertSQL = `INSERT INTO tokens (collection_id, token_id, owner) 
    VALUES(${collectionId},${tokenId},'${owner}')`
    await pool.query(insertSQL);
  } else {
    const updateSQL = `UPDATE tokens SET owner = '${owner}' WHERE collection_id = ${collectionId} and token_id = ${tokenId}`;
    await pool.query(updateSQL);
  }
}

 async function start (api, pool, config) {
  logger.info(loggerOptions, "Starting token crawler...");

  const ids = await getCollectionIds(pool);  
  try {
    for await (const item of getCountEach(api, ids)) {
      if (item.count === 0) {
        continue;
      }      
      for await (const token of getTokens(api,pool, item.collectionId, item.count)) {
        await saveToken(pool, token);
      }
    }
  } catch (error) {
    console.error(error);
  }
  updateTotals(pool, loggerOptions)  
};

module.exports = { start }