import { EventCollection } from '../eventCollection';
import collectionDB from '../../../lib/collectionDB';
import { Transaction } from 'sequelize/types';

export class UpdateCollection extends EventCollection {
  public async save(transaction: Transaction): Promise<void> {
    const isDestroyed = await this.isDestroyed();

    if (!isDestroyed) {
      const collection = await this.getCollection();
      await collectionDB.save({
        collection,
        sequelize: this.sequelize,
        transaction,
        excludeFields: ['date_of_creation'],
      });
    }
  }

}
