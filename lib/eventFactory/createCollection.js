const { EventCollection } = require('./eventCollection.js');
const collectionDB = require('../collectionDB.js');


class CreateCollection extends EventCollection {
  async save() {
    if (this.data.collectionId) {
      const collection = await this.getCollection();
      await collectionDB.add(collection, this.sequelize);
    }
  }  
}

module.exports = { CreateCollection };