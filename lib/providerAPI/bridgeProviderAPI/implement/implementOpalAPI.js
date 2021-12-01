const { ImplementorAPI } = require('./implementorAPI.js');

class ImplementOpalAPI extends ImplementorAPI {
  async impGetCollection(collectionId) {
    const collection = await this._api.rpc.unique.collectionById(collectionId);
    return this.toObject(collection);
  }

  async impGetCollectionCount() {
    const collectionStats = await this._api.rpc.unique.collectionStats();
    return collectionStats?.created.toNumber();
  }
}

module.exports = { ImplementOpalAPI };
