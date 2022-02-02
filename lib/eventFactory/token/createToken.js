const { EventToken } = require('../eventToken.js')
const tokenDB = require('../../tokenDB.js');
const collectionStatsDB = require('../../collectionsStatsDB');

class CreateToken extends EventToken {
  async save() {
    if (this.data.collectionId && this.data.tokenId) {
      const token = await this.getToken();
      await tokenDB.save(token, this.sequelize);
    }
  }  
}

module.exports = { CreateToken };