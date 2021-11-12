const { EventToken } = require('./eventToken.js')
const tokenDB = require('../tokenDB.js');

class CreateToken extends EventToken {
  async save() {
    if (this.data.collectionId && this.data.tokenId) {
      const token = await this.getToken();
      await tokenDB.add(token, this.sequelize);
    }
  }  
}

module.exports = { CreateToken };