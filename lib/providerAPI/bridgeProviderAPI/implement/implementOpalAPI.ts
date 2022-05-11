import { ImplementorAPI } from './implementorAPI';

export class ImplementOpalAPI extends ImplementorAPI {
  async impGetCollection(collectionId) {
    const collection = await this._api.rpc.unique.collectionById(collectionId);
    return this.toObject(collection);
  }

  async impGetCollectionCount() {
    const collectionStats = await this._api.rpc.unique.collectionStats();
    return collectionStats?.created.toNumber();
  }

  async impGetToken(collectionId, tokenId) {
    const tokenData = await this._api.query.nonfungible.tokenData(collectionId, tokenId);
    const data = tokenData.toJSON();

    let constData = await this._api.rpc.unique.constMetadata(
      collectionId,
      tokenId
    );
    let variableMetadata = await this._api.rpc.unique.variableMetadata(
      collectionId,
      tokenId
    );

    const owner: string = data && data['owner'];

    return {
      owner,
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
