class ImplementorAPI {  
  constructor (api) {
    this._api = api;
  }
  async impGetCollection(collectionId) {}   
  async impGetCollectionCount() {}
  async impGetTokenCount(collectionId) {}  
  async impGetToken(collectionId, tokenId) {} 

  async impGetBlockHash (blockNumber) {
    return await this._api.rpc.chain.getBlockHash(blockNumber);
  }

  toObject(aValue) {
    let result = aValue;
    if (!('Owner' in aValue)) {
      result = Object.assign({}, result.toJSON());
    }
    return result;
  }
}

module.exports = { ImplementorAPI };