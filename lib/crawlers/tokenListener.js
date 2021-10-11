const pino = require('pino')
const {
  genArrayRange,
  updateTotals
} = require('../utils.js')
const logger = pino()


const loggerOptions = {
  crawler: "tokenListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

async function getCollectionIds (pool) {
  const sql = `SELECT collection_id FROM collections`;
  const res = await pool.query(sql);    
  return res.rows.map(item => item.collection_id)  
}

 async function getCountTokens(api, collectionId) {
    const count = await api.query.nft.itemListIndex(collectionId);
    return count;
 }

 async function getToken({ api, collectionId, tokenId }) {
   let result = await getSource(api, collectionId, tokenId);
   if (result) {
     return {
       owner: result?.Owner || null,
       collectionId,
       tokenId,
     };
   }
   return null;
 }

async function getSource(api, collectionId, tokenId) {
  let result = await api.query.nft.nftItemList(collectionId, tokenId);
  if (!('Owner' in result)) {
    result = result.toJSON();
  }
  return result;
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

async function checkToken(pool, {owner, collectionId, tokenId}) {
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
    const token = await getToken({api, collectionId, tokenId: item}); 

    if (token) {
      const check = await checkToken(pool, {
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
  const {check} = token;
  if (check === 'insert') {    
    await insertToken({
      pool,
      ...token
    })
  } else {
    await updateToken({
      pool,
      ...token
    })
  }
}

async function deleteToken({pool, tokenId, collectionId}) {
  const deleteToken = `DELETE FROM tokens WHERE token_id = ${tokenId} and collection_id = ${collectionId}`;
  await pool.query(deleteToken)
}

async function insertToken({ pool, owner, collectionId, tokenId }) {
  const insertSQL = `INSERT INTO tokens (collection_id, token_id, owner) 
  VALUES(${collectionId},${tokenId},'${owner}')`
  await pool.query(insertSQL);
}

async function updateToken({ pool, owner, collectionId, tokenId }) {
  const updateSQL = `UPDATE tokens SET owner = '${owner}' WHERE collection_id = ${collectionId} and token_id = ${tokenId}`;
  await pool.query(updateSQL);
}

async function moveToken({
  pool, tokenId, collectionId, sender
}) {
  const updateSQL = `UPDATE tokens SET owner = '${sender}' WHERE collection_id = ${collectionId} and token_id = ${tokenId}`;
  await pool.query(updateSQL)
}
 async function start (api, pool, config) {
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS
  logger.info(loggerOptions, "Starting token crawler...");

  (async function run() {
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
    setTimeout(() => run(), pollingTime)
  })()  
};

module.exports = { start, getToken, checkToken, saveToken, deleteToken, moveToken }