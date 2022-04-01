const {
  parseHexToString,
  bufferToJSON,
  avoidUseBuffer,
  normalizeSubstrateAddress
} = require('../utils/utils.js');

async function get(collectionId, bridgeAPI) {
  const collection = await bridgeAPI.getCollection(collectionId);
      
  if (collection && Object.keys(collection).length !== 0) {
    return getData(
      Object.assign(collection, { collectionId })
    );
  }
  return collection;
}

function toObject (collection) {
  let result = {};
  if (!('Owner' in collection)) {        
    result = Object.assign({}, collection.toJSON());
  }
  return result;
}

function getSponsorship (collection) {
  const result = {};    
  result.sponsorship = ('disabled' in collection.Sponsorship) ? null : JSON.stringify(collection.Sponsorship);
  return result;  
}

function getSponsoredRateLimit(sourceLimit) {
  if (sourceLimit === 'SponsoringDisabled') {
    return -1;
  }

  if (Number.isInteger(sourceLimit?.blocks)) {
    return sourceLimit.blocks;
  }

  return null;
}

function getLimits (collection) {
  const limits = collection.Limits;
  const result = {};
  result.tokenLimit = limits.TokenLimit || 0;
  result.limitsAccountOwnership = limits.AccountTokenOwnershipLimit || 0;
  result.limitsSponsoreDataSize = limits.SponsoredDataSize;
  result.limitsSponsoreDataRate = getSponsoredRateLimit(limits.SponsoredDataRateLimit);
  result.ownerCanTransfer = limits.OwnerCanTransfer;
  result.ownerCanDestroy = limits.OwnerCanDestroy;
  return result;
}

function getSchema (collection) {
  const result = {};
  result.offchainSchema = parseHexToString(collection.OffchainSchema);
  result.constChainSchema = bufferToJSON(collection.ConstOnChainSchema);
  result.variableOnChainSchema = bufferToJSON(collection.VariableOnChainSchema);
  result.schemaVersion = collection.SchemaVersion;
  return result;
}

function getData( collection ) {
  const result = {};
  result.collection_id = collection.collectionId;
  result.owner = normalizeSubstrateAddress(collection.Owner);
  result.name = avoidUseBuffer(collection.Name);
  result.description = avoidUseBuffer(collection.Description);
  result.tokenPrefix = parseHexToString(collection.TokenPrefix);
  result.mode = JSON.stringify(collection.Mode);    
  result.mint_mode = collection.MintMode;
  return Object.assign(
    result, 
    getSponsorship(collection),
    getLimits(collection),
    getSchema(collection),
  );
}

module.exports = Object.freeze({
  get
});