class ImplementorAPI {  
  constructor (api) {
    this._api = api;
  }
  async impGetCollection(collectionId) {} 
  async impGetToken(tokenId, collectionId) {} 
  async impGetCollectionCount() {}

  toObject(aValue) {
    let result = aValue;
    if (!('Owner' in aValue)) {
      result = Object.assign({}, result.toJSON());
    }
    return result;
  }
}

module.exports = { ImplementorAPI };