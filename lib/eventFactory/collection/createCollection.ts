import { EventCollection } from '../eventCollection';
import collectionDB from '../../../lib/collectionDB';
import { Transaction } from 'sequelize/types';

export class CreateCollection extends EventCollection {
  public async save(transaction: Transaction): Promise<void> {
    const isDestroyed = await this.isDestroyed();

    if (isDestroyed) {
      return;
    }

    const collection = await this.getCollection();

    if (collection) {
      await collectionDB.save({
        collection,
        sequelize: this.sequelize,
        transaction,
      });
    }
  }

}
