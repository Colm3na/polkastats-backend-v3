const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');


class ConfirmSponsorship extends EventAccountCollection {
  async save() {    
  }  
}

module.exports = { ConfirmSponsorship };