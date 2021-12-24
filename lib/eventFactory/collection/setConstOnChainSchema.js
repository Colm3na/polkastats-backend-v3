const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetConstOnChainSchema extends EventCollection {
  async save() {
    console.log('RemoveCollectionSponsor');
  }
}

module.exports = { SetConstOnChainSchema };