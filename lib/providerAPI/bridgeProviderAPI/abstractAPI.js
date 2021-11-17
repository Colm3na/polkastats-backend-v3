class AbstractAPI {      
  constructor (impl) {
    this.impl = impl;
  }  
  
  get api() {
    return this.impl._api;
  }

  getCollection(collectionId) {
    throw new Error("This is method is abastrac");
  }

  getToken(collectionId, tokenId) {
    throw new Error("This is method is abastract");
  }
}

module.exports = { AbstractAPI };