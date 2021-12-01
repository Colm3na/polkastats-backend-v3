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

  getCollectionCount() {    
    throw new Error("This is method is abastract");
  }
  
  async getBlockHash(blockNumber) {
    return await this.impl.impGetBlockHash(blockNumber);
  }
}

module.exports = { AbstractAPI };