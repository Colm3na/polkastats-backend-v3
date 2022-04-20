import { AbstractAPI } from './abstractAPI';

export class TestnetAPI extends AbstractAPI {
  async getCollection(id) {
    const collection = await this.impl.impGetCollection(id);
    return collection;
  }

  async getToken(collectionId, tokenId) {
    const token = await this.impl.impGetToken(collectionId, tokenId);
    return token;
  }

  async getCollectionCount() {
    const count = await this.impl.impGetCollectionCount();
    return count;
  }

  async getTokenCount(collectionId) {
    return await this.impl.impGetTokenCount(collectionId);
  }
}
