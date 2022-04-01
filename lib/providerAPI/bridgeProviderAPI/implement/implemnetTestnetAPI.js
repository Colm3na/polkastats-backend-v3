const { ImplementorAPI } = require("./implementorAPI.js");

class ImplementTestnetAPI extends ImplementorAPI {
  async impGetCollection(id) {
    const collection = await this._api.query.nft.collectionById(id);
    return this.toObject(collection);
  }  

  async impGetCollectionCount() {
    const collectionCount = await this._api.query.nft.createdCollectionCount();
    return collectionCount.toNumber();
  }

  async impGetToken(collectionId, tokenId) {
    const token = await this._api.query.nft.nftItemList(collectionId, tokenId);
    return this.toObject(token);
  }

  async impGetTokenCount(collectionId) {
    const count = await this._api
      .query
      .nft
      .itemListIndex(collectionId);
    return count;
  }
}

module.exports = { ImplementTestnetAPI };