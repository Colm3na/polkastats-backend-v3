import { Transaction } from 'sequelize/types';
import tokenDB from '../../../lib/tokenDB';
import { EventToken } from '../eventToken';

export class CreateToken extends EventToken {
  async save(transaction: Transaction) {
    const canCreateNewToken = await this.canSave();

    if (canCreateNewToken) {
      const token = await this.getToken();
      await tokenDB.save({
        token,
        transaction,
        sequelize: this.sequelize,
      });
    }
  }
}
