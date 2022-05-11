import collectionData from '../../lib/collectionData';
import { Sequelize, Transaction } from 'sequelize/types';
import { OpalAPI } from '../../lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from '../../lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import eventsDB from '../../lib/eventsDB';
import { EventTypes } from './type';

export abstract class EventCollection {
  constructor (
    protected bridgeAPI: OpalAPI | TestnetAPI,
    protected sequelize: Sequelize,
    public collectionId: number,
    public timestamp: number,
  ) {
    if (!this.collectionId) {
      throw new Error(`Can't create/modify collection without collectionId(${this.collectionId})`);
    }
  }

  public async getCollection() {
    if (!this.collectionId) {
      return;
    }

    const collection = await collectionData.get(this.collectionId, this.bridgeAPI);
    return {
      ...collection,
      date_of_creation: this.timestamp,
    };
  }

  public isDestroyed(): Promise<boolean> {
    return eventsDB.getCollectionEvent(
      this.sequelize,
      this.collectionId,
      EventTypes.TYPE_COLLECTION_DESTROYED,
    );
  }

  public abstract save(transaction: Transaction): Promise<void>;
}
