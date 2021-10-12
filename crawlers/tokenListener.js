import Sequelize from 'sequelize'
import pino from 'pino'
import { genArrayRange, updateTotals } from '../utils/utils.js'

const logger = pino()
const { QueryTypes } = Sequelize

const loggerOptions = {
  crawler: "tokenListener",
};

const DEFAULT_POLLING_TIME_MS = 60 * 60 * 1000;

async function getCollectionIds (sequelize) {  
  const res = await sequelize.query('SELECT collection_id FROM collections', {
    type: QueryTypes.SELECT,
    logging: false,
  })  
  return res.map(item => item.collection_id)
}

async function getCountTokens(api, collectionId) {
  const count = await api.query.nft.itemListIndex(collectionId);
  return count;
}

async function getToken({ api, collectionId, tokenId }) {
  let result = await getSource({api, collectionId, tokenId});
  if (result) {
    return {
      owner: result?.Owner || null,
      collectionId,
      tokenId,
    };
  }
  return null;
}

async function getSource({api, collectionId, tokenId}) {
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
  if (res.length === 0) {
    return 'insert';
  } else {            
    if (res.owner === owner) {
      return 'update';
    } else {
      return null
    }
  }
}
// TODO: Подвергнуть рефракторингу
async function* getTokens(api, sequelize, collectionId, count) {
  const range = genArrayRange(1, count);
  for (const item of range) {
    const token = await getToken({api, collectionId, tokenId: item}); 

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
  await sequelize.query(`INSERT INTO tokens (collection_id, token_id, owner) VALUES(:collectionId, :tokenId, ':owner')`, {
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
    const ids = await getCollectionIds(sequelize)
    try {
      for await (const item of getCountEach(api, ids)) {
        if (item.count === 0) continue;
        for await (const token of getTokens(api, sequelize, item.collectionId, item.count)) {
          await saveToken(sequelize, token)
        }
      }
    } catch (error) {
      console.error(error)
    }
    updateTotals(sequelize, loggerOptions)  
    setTimeout(() => run(), pollingTime)
  })()

}

export { start, getToken, checkToken, saveToken, deleteToken, moveToken }