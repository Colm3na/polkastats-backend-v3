const {
  bufferToString,
  parseHexToString,
  bufferToJSON,
  avoidUseBuffer
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
  result.sponsorshipConfirmed = ('disabled' in collection.Sponsorship) ? null : JSON.stringify(collection.Sponsorship);
  return result;  
}

function getLimits (collection) {
  const limits = collection.Limits;
  const result = {};
  result.tokenLimit = limits.TokenLimit || 0;
  result.limitsAccoutOwnership = limits.AccountTokenOwnershipLimit || 0;
  result.limitsSponsoreDataSize = limits.SponsoredDataSize;
  result.limitsSponsoreDataRate = limits.SponsoredDataRateLimit;
  result.ownerCanTrasfer = limits.OwnerCanTransfer;
  result. ownerCanDestroy = limits.OwnerCanDestroy;
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
  result.owner = collection.Owner;
  result.name = avoidUseBuffer(collection.Name);
  result.description = avoidUseBuffer(collection.Description);
  result.tokenPrefix = parseHexToString(collection.TokenPrefix);
  result.mode = JSON.stringify(collection.Mode);    
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