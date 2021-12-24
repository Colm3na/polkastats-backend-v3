const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class DestoyCollection extends EventCollection {
  async save() {
    if (this.data.collectionId) {
      console.log('->', this.data.collectionId);
      console.log('DestoyCollection');
      await collectionDB.del(this.data.collectionId, this.sequelize);
    }    
  }
}

module.exports = { DestoyCollection };