const pino = require('pino');
const { QueryTypes } = require('sequelize');
const { genArrayRange, updateTotals, parseHexToString } = require('../utils/utils.js');
const protobuf = require('../utils/protobuf.js');

const utilsCollection = require('../lib/collections.js');

const logger = pino()

const loggerOptions = {
  crawler: "tokenListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;


async function getCollections (sequelize) {
  const res = await utilsCollection.get({
    selectList: ['collection_id', 'const_chain_schema'],
    sequelize
  });    
  return res.map(enrichCollection)  
}

function enrichCollection(item) {
  const results = {};
  results.collectionId = item.collection_id;
  results.schema = protobuf.getProtoBufRoot(item.const_chain_schema);
  return results;
}

async function* addRange(api, sequelize) {

  const collections = await getCollections(sequelize);    
  
  for (const collection of collections) {
    const tokenCount  = await api.query.nft.itemListIndex(collection.collectionId);    
    if (tokenCount !== 0) {
      const result = Object.assign({}, collection);
      result.range = genArrayRange(1, (tokenCount + 1));
      yield result;
    }    
  }   
}

function constData(data, schema) {
  const source = parseHexToString(data);  
  if (source && schema !== null) {
    const statement = {
      buffer: Buffer.from(source, 'hex'),
      locale: 'en',
      root: schema
    };
    return protobuf.deserializeNFT(statement)
  }
  return {
    hex: source      
  }
}

async function _getToken({
  api, collection, tokenId 
}) {  
  let source = await api.query.nft.nftItemList(
    collection.collectionId, 
    tokenId
  );
  
  return checkSource(source);
  
  function checkSource(source) {
    if (!source) {
      return null;
    }
    if (!('Owner' in source)) {
      source = source.toJSON();
    }
    return setTokenData(source);
  }

  function setTokenData(source) {    
    const result = {}
    result.owner = source?.Owner || null;
    result.constData = constData(source?.ConstData, collection.schema);
    result.collectionId = collection.collectionId;
    result.tokenId = tokenId;    
    return result;
  }
}

async function getToken({
  api, collectionId, tokenId 
}) {  
  let source = await api.query.nft.nftItemList(
    collectionId, 
    tokenId
  );
  
  return checkSource(source);
  
  function checkSource(source) {
    if (!source) {
      return null;
    }
    if (!('Owner' in source)) {
      source = source.toJSON();
    }
    return setTokenData(source);
  }

  function setTokenData(source) {    
    const result = {}
    result.owner = source?.Owner || null;
    result.constData = null; //constData(source?.ConstData, collection.schema);
    result.collectionId = collectionId;
    result.tokenId = tokenId;    
    return result;
  }
}

async function checkToken(sequelize, {owner, collectionId, tokenId}) {
  const res = await sequelize.query(
    'SELECT owner FROM tokens WHERE collection_id = :collectionId and token_id = :tokenId', {
    replacements: {
      collectionId, tokenId
    },
    type: QueryTypes.SELECT,
    logging: false,
    plain: true
  });  
  if (!res) {
    return 'insert';
  } else {            
    if (res.owner === owner) {
      return 'update';
    } else {
      return null
    }
  }
}
// NEED_REFACTORING: 
async function* getTokens(api, sequelize, collection) {  
  for (const item of collection.range) {
    const statement = {
      api,
      collection,
      tokenId: item
    }
    const token = await _getToken(statement); 

    if (token) {
      const check = await checkToken(sequelize, {
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

async function saveToken(sequelize, token) {
  const {check} = token;
  if (check === 'insert') {    
    await insertToken({
      sequelize,
      ...token
    })
  } else {
    await updateToken({
      sequelize,
      ...token
    })
  }
}

async function deleteToken({sequelize, tokenId, collectionId}) {  
  await sequelize.query('DELETE FROM tokens WHERE token_id = :tokenId and collection_id = :collectionId', {
    replacements: {
      tokenId, collectionId
    },
    type: QueryTypes.DELETE
  })
}

async function insertToken({ sequelize, owner, collectionId, tokenId }) {
  await sequelize.query(`INSERT INTO tokens (collection_id, token_id, owner, data) VALUES(:collectionId, :tokenId, :owner, :data)`, {
    type: QueryTypes.INSERT,
    replacements: {
      owner, collectionId, tokenId
    }
  });  
}

async function updateToken({ sequelize, owner, collectionId, tokenId }) {
  await sequelize.query(`UPDATE tokens SET owner = :owner WHERE collection_id = :collectionId and token_id = :tokenId`, {
    type: QueryTypes.UPDATE,
    logging: false,
    replacements: {
      owner, collectionId, tokenId
    }
  })  
}

async function moveToken({
  sequelize, tokenId, collectionId, sender
}) {
  await updateToken({
    sequelize, tokenId, collectionId, owner: sender
  })
}

async function start({api, sequelize, config}) {
  
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS
  logger.info(loggerOptions, "Starting token crawler...");

  (async function run() {    
    try {

      const collections = await addRange(api, sequelize);
      // NEED_REFACTORING:
      for await (const collection of collections) {
        for await (const token of getTokens(api, sequelize, collection)) {
          await saveToken(sequelize, token);
        }
      }      
    } catch (error) {
      console.error(error)
    }    
    updateTotals(sequelize, loggerOptions)  
    setTimeout(() => run(), pollingTime)
  })()

}

module.exports = {
  start, 
  getToken, 
  checkToken, 
  saveToken, 
  deleteToken, 
  moveToken,
  getCollections,
  addRange
}