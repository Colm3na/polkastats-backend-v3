import { ApiPromise } from '@polkadot/api';
import { AnyJson } from '@polkadot/types/types';

export abstract class ImplementorAPI {  
  constructor (public _api: ApiPromise) {}
  abstract impGetCollection(collectionId): Promise<any>;
  abstract impGetCollectionCount(): Promise<number>;
  abstract impGetTokenCount(collectionId): Promise<number>;
  abstract impGetToken(collectionId, tokenId): Promise<any>;

  async impGetBlockHash (blockNumber) {
    return await this._api.rpc.chain.getBlockHash(blockNumber);
  }

  toObject(aValue) {
    let result = aValue;
    if (!('Owner' in aValue)) {
      result = Object.assign({}, result.toJSON());
    }
    return result;
  }
}
