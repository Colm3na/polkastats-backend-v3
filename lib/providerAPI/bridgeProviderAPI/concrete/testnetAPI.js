const { ImplementorAPI } = require("../implementorAPI.js");

class ConcreteTestnetAPI extends ImplementorAPI {
  async impGetCollection(id) {
    const collection = await this._api.query.nft.collectionById(id);
    return this.toObject(collection);
  }
}

module.exports = { ConcreteTestnetAPI };