class ImplementorAPI {  
  constructor (api) {
    this._api = api;
  }
  async impGetCollection(collectionId) {}   
  async impGetCollectionCount() {}

  async impGetToken(collectionId, tokenId) {
    const token = await this._api.query.nft.nftItemList(collectionId, tokenId);
    return this.toObject(token);
  } 

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