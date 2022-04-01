const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class DestoyCollection extends EventCollection {
  async save() {
    if (this.data.collectionId) {
      await collectionDB.del(this.data.collectionId, this.sequelize);
    }    
  }
}

module.exports = { DestoyCollection };