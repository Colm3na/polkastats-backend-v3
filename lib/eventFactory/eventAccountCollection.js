const { EventCollection } = require('./eventCollection.js');
const collectionDB = require('../collectionDB.js');

class EventAccountCollection extends EventCollection {
  get data() {
    const result = {};
    result.collectionId = this._data[0] || null;
    result.accountId = this._data[1] || null;    
    return result;
  }

  async save() {
    if (this.data.collectionId) {
      const collection = await this.getCollection();
      const update = {
        collection,
        sequelize: this.sequelize
      }
      await collectionDB.modify(update);
    }
  }
}

module.exports = { EventAccountCollection };