const tokenDB = require('../../tokenDB.js');
const { Events } = require('../events.js');

class DestroyedToken extends Events {
  async save() {
    if (this.data.collectionId && this.data.tokenId) {
      await tokenDB.del(this.data, this.sequelize);
    }
  }
}

module.exports = { DestroyedToken };