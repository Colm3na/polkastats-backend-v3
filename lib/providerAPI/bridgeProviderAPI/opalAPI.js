const { AbstractAPI } = require("./abstractAPI.js");

class OpalAPI extends AbstractAPI {  
  async getCollection(id) {
    const collecton = await this.impl.impGetCollection(id);    
    return collecton; 
  }

  getLimit(collecton) {}
}

module.exports = { OpalAPI };