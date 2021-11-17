const { AbstractAPI } = require("./abstractAPI.js");

class OpalAPI extends AbstractAPI {  
  async getCollection(id) {
    let collecton = await this.impl.impGetCollection(id);
    if (collecton) {
      collecton = this.capitalizeObject(collecton, (item, key) => {
        if (key === 'limits') {
          const limits = item[key];
          item[key] = this.capitalizeObject(limits, (limit, i) => limit[i])
        }
        return item[key];
      });      
    }
    return collecton; 
  }
    
  capitalizeObject(obj, fn) {
    return Object.keys(obj).reduce((res, key) => {
      res[this.capitalizeFirstLetter(key)] = fn(obj, key);
      return res;
    }, {});
  }

  capitalizeFirstLetter (str = '') {
    return str.charAt(0).toUpperCase() + str.slice(1);
  } 

  async getToken(collectionId, tokenId) {
    let token = await this.impl.impGetToken(collectionId, tokenId);
    token = this.capitalizeObject(token, (item, key) => {
      if (key === 'owner') {
        let owner = item[key];
        item[key] = Object.keys(owner).map((_k) => owner[_k])[0];
      }
      return item[key];
    })
    return token;
  }
}

module.exports = { OpalAPI };