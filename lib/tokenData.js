const protobuf = require('../utils/protobuf.js');

function getDeserializeConstData(aStatement) {
  let result = {};
  if ('buffer' in aStatement) {
    try {
      result = Object.assign({}, protobuf.deserializeNFT(aStatement));
    } catch (error) {
      console.error(error);      
      result.hex = aStatement.constData?.toString().replace('0x', '') || aStatement.constData;
    }   
  } else {
    result.hex = aStatement.constData?.toString().replace('0x', '') || aStatement.constData;
  };
  return result;
}

function preConstData(aConstData, aSchema) {
  const result = {};
  result.constData = aConstData;  
  const buffer = Buffer.from(
    aConstData.replace("0x", ""), 
    'hex'
  );    
  if (buffer.toString().length !== 0 && aConstData.replace("0x","") 
    && aSchema !== null
    ) {
    result.buffer = buffer;
    result.locale = 'en';
    result.root = aSchema;
  }
  return result;
}

function toObject(token) {
  let result = {};
  if (!('Owner' in token)) {    
    result = Object.assign(result, token.toJSON());
  }
  return result;
}

function getConstData(aConstData, aSchema) {
  const statement = preConstData(aConstData, aSchema);
  return JSON.stringify(
    getDeserializeConstData(statement)
  );    
}

function getToken(aToken) {
  let result = null;
  if (aToken?.Owner) {
    result = getData(aToken);
  }
  return result;    
}

async function get({
  collection, tokenId, api
}) {
   const token = await api.query.nft.nftItemList(
    collection.collectionId, 
    tokenId
  );
  return getToken(
    Object.assign(toObject(token), {
      collectionId: collection.collectionId,
      tokenId,
      schema: collection.schema
    })
  );
}

function getData(aToken) {
  const result = {}
  result.owner = aToken?.Owner;
  result.constData = getConstData(aToken?.ConstData, aToken.schema);    
  result.collectionId = aToken.collectionId;
  result.tokenId = aToken.tokenId;    
  return result;
}

module.exports = Object.freeze({  
  get,
  toObject,

  preConstData,
  getConstData,
  getData,
  getDeserializeConstData,
});