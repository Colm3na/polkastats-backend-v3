const { EventCollection } = require('./eventCollection.js');
const collectionDB = require('../collectionDB.js');


class CreateCollection extends EventCollection {
  async save() {
    if (this.data.collectionId) {
      const collection = await this.getCollection();      
      const add = {
        collection,
        sequelize: this.sequelize
      }
      await collectionDB.add(add);
    }
  }  
}

module.exports = { CreateCollection };