const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class RemoveCollectionSponsor extends EventCollection {
  async save() {
    console.log('RemoveCollectionSponsor');
  }
}

module.exports = { RemoveCollectionSponsor };