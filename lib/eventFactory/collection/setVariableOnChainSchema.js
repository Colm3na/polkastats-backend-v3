
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetVariableOnChainSchema extends EventCollection {
  async save() {
    console.log('VariableOnChainSchemaSet');
  }
}

module.exports = { SetVariableOnChainSchema };