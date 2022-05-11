import { Transaction } from 'sequelize/types';
import collectionDB from '../../../lib/collectionDB';
import { EventCollection } from '../eventCollection';

export class DestroyCollection extends EventCollection {
  async save(transaction: Transaction) {
    await collectionDB.del(this.collectionId, this.sequelize, transaction);
  }
}
