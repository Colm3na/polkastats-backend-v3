const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');


class CollectionAdminAdded extends EventAccountCollection {
  async save() {    
  }  
}

module.exports = { CollectionAdminAdded };