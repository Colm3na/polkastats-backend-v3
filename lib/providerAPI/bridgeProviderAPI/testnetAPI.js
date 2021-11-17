const { AbstractAPI } = require("./abstractAPI.js");

class TestnetAPI extends AbstractAPI {  
  async getCollection(id) {
    const collection = await this.impl.impGetCollection(id);    
    return collection;
  }
}

module.exports = { TestnetAPI };