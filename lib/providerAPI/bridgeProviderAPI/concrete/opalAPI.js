const { ImplementorAPI } = require("../implementorAPI.js")

class ConcreteOpalAPI extends ImplementorAPI {
  async impGetCollection(collectionId) {
    const collection = await this._api.query.nft.collectionById(collectionId);
    return this.toObject(collection);
  }  
}

module.exports = { ConcreteOpalAPI };