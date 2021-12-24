
const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');

class SetMintPermission extends EventCollection {
  async save() {
    console.log('RemoveCollectionSponsor');
  }
}

module.exports = { SetMintPermission };