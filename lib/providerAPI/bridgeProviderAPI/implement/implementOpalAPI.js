const { ImplementorAPI } = require('./implementorAPI.js');

class ImplementOpalAPI extends ImplementorAPI {
  async impGetCollection(collectionId) {
    const collection = await this._api.rpc.unique.collectionById(collectionId);
    return this.toObject(collection);
  }

  async impGetCollectionCount() {
    const collectionStats = await this._api.rpc.unique.collectionStats();
    return collectionStats?.created.toNumber();
  }

  async impGetToken(collectionId, tokenId) {
    let owner = await this._api.rpc.unique.tokenOwner(collectionId, tokenId);
    let constData = await this._api.rpc.unique.constMetadata(
      collectionId,
      tokenId
    );
    let variableMetadata = await this._api.rpc.unique.variableMetadata(
      collectionId,
      tokenId
    );

    return {
      owner: owner.toJSON(),
      constData: constData.toJSON(),
      variableData: variableMetadata.toJSON(),
    };
  }

  async impGetTokenCount(collectionId) {
    const count = (
      await this._api.rpc.unique.lastTokenId(collectionId)
    ).toJSON();
    return count;
  }
}

module.exports = { ImplementOpalAPI };
