const { ImplementorAPI } = require("./implementorAPI");

class ImplementQuartzAPI extends ImplementorAPI {
  async impGetCollection(id) {
    const collection = await this._api.query.nft.collectionById(id);
    return this.toObject(collection);
  }

  async impGetCollectionCount() {
    console.log('api->', this._api.rpc);
    const collectionStats = await this._api.rpc.unique.collectionStats();    
    console.log('collectionStats->', collectionStats);
    return collectionStats?.created.toNumber();
  }
}

module.exports = { ImplementQuartzAPI };