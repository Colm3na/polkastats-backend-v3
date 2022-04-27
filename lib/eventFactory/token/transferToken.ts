import { Transaction } from 'sequelize/types';
import tokenDB from '../../../lib/tokenDB';
import { EventToken } from '../eventToken';

export class TransferToken extends EventToken {
  async save(transaction: Transaction) {
    const canSaveToken = await this.canSave();
    const excludeFields = ['date_of_creation'];

    if (canSaveToken) {
      const token = await this.getToken();
      await tokenDB.save({
        token,
        transaction,
        excludeFields,
        sequelize: this.sequelize,
      });
    }
  }
}
