const { ImplementorAPI } = require("./implementorAPI.js")

class ImplementOpalAPI extends ImplementorAPI {
  async impGetCollection(collectionId) {
    const collection = await this._api.query.nft.collectionById(collectionId);
    return this.toObject(collection);
  }  
}

module.exports = { ImplementOpalAPI };