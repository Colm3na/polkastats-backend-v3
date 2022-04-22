import tokenDB from '../../../lib/tokenDB';
import { EventToken } from '../eventToken';

export class DestroyToken extends EventToken {
  async save() {
    if (this.collectionId && this.tokenId) {
      await tokenDB.del(this.tokenId, this.collectionId, this.sequelize);
    }
  }
}
