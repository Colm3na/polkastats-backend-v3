
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetCollectionLimits extends EventCollection {
  async save() {
    console.log('OffchainSchemaSet');
  }
}

module.exports = { SetCollectionLimits };