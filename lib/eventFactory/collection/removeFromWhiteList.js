const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');

class RemoveFromWhiteList extends EventAccountCollection {
  async save() {
    console.log('RemoveFromWhiteList');
  }
}

module.exports = { RemoveFromWhiteList };