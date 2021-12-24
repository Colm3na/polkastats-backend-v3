const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');


class CollectionOwnedChanged extends EventAccountCollection {
  async save() {    
  }  
}

module.exports = { CollectionOwnedChanged };