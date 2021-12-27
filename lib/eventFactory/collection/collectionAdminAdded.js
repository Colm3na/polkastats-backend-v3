const collectionDB = require('../../collectionDB.js');
const { EventAccountCollection } = require('../eventAccountCollection.js');


class CollectionAdminAdded extends EventAccountCollection {
  async save() {
    const collection = await this.getCollection();
    const update = {
      collection,
      sequelize: this.sequelize
    }
    await collectionDB.modify(update);
  
  }  
}

module.exports = { CollectionAdminAdded };