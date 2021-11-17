const { AbstractAPI } = require("./abstractAPI.js");

class TestnetAPI extends AbstractAPI {  
  async getCollection(id) {
    const collection = await this.impl.impGetCollection(id);    
    return collection;
  }

  async getToken(collectionId, tokenId) {
    const token = await this.impl.impGetToken(collectionId, tokenId);
    return token;
  }
}

module.exports = { TestnetAPI };