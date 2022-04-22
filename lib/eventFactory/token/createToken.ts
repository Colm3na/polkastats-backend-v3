import tokenDB from '../../../lib/tokenDB';
import { EventToken } from '../eventToken';

export class CreateToken extends EventToken {
  async save() {
    if (this.collectionId && this.tokenId) {
      const token = await this.getToken();
      await tokenDB.save(token, this.sequelize);
    }
  }  
}
