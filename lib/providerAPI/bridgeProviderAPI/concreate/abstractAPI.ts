import { ImplementorAPI } from '../implement/implementorAPI';

export class AbstractAPI {      
  constructor (public impl: ImplementorAPI) {}  
  
  get api() {
    return this.impl._api;
  }

  getCollection(collectionId) {
    throw new Error("This is method is abastrac");
  }

  getToken(collectionId, tokenId) {
    throw new Error("This is method is abastract");
  }

  getTokenCount(collectionId) {
    throw new Error("This is method is abastract");
  }

  getCollectionCount() {    
    throw new Error("This is method is abastract");
  }
  
  async getBlockHash(blockNumber) {
    return await this.impl.impGetBlockHash(blockNumber);
  }
}
