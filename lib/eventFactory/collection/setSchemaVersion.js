
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetSchemaVersion extends EventCollection {
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

module.exports = { SetSchemaVersion };