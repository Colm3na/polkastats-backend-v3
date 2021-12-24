
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetSchemaVersion extends EventCollection {
  async save() {
    console.log('SchemaVersionSet');
  }
}

module.exports = { SetSchemaVersion };