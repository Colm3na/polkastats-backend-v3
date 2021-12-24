const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');


class RemoveCollectionAdmin extends EventAccountCollection {
  async save() {    
  }  
}

module.exports = { RemoveCollectionAdmin };