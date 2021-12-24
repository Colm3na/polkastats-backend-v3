
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetOffchainSchema extends EventCollection {
  async save() {
    console.log('OffchainSchemaSet');
  }
}

module.exports = { SetOffchainSchema };