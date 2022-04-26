import { Transaction } from 'sequelize/types';
import eventsDB from '../../../lib/eventsDB';
import tokenDB from '../../../lib/tokenDB';
import { EventToken } from '../eventToken';
import { EventTypes } from '../type';

export class CreateToken extends EventToken {
  async save(transaction: Transaction) {
    if (!this.collectionId || !this.tokenId) {
      throw new Error(`Can't create token without collectionId(${this.collectionId}) or tokenId(${this.tokenId})`);
    }

    const canCreateNewToken = await this.canCreateToken();

    if (canCreateNewToken) {
      const token = await this.getToken();
      await tokenDB.save(token, this.sequelize, transaction);
    }
  }

  private async canCreateToken(): Promise<boolean> {
    const destroyTokenEvent = await eventsDB.getTokenEvent(
      this.sequelize,
      this.collectionId,
      this.tokenId,
      EventTypes.TYPE_ITEM_DESTROYED,
    );

    const destroyCollectionEvent = await eventsDB.getTokenEvent(
      this.sequelize,
      this.collectionId,
      this.tokenId,
      EventTypes.TYPE_COLLECTION_DESTROYED,
    );

    return !destroyTokenEvent && !destroyCollectionEvent;
  }
}
