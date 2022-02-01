const tokenDB = require('../../tokenDB.js');
const { Events } = require('../events.js');
const collectionStatsDB = require('../../collectionsStatsDB');

class DestroyedToken extends Events {
  async save() {
    if (this.data.collectionId && this.data.tokenId) {
      await collectionStatsDB.decreaseHoldersCount(
        this.sequelize,
        this.data.collectionId,
        this.data.tokenId,
      );
      await tokenDB.del(this.data, this.sequelize);
      await collectionStatsDB.decreaseTokensCount(
        this.sequelize,
        this.data.collectionId,
      );
    }
  }
}

module.exports = { DestroyedToken };