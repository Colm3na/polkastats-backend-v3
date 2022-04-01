const { EventCollection } = require('../eventCollection.js');
const collectionDB = require('../../collectionDB.js');


class CreateCollection extends EventCollection {
  async save() {
    if (!this.data.collectionId) {
      return;
    }

    const collection = await this.getCollection();      
    const existenCollections = await collectionDB.get({
      collectionId: this.data.collectionId,
      sequelize: this.sequelize,
    });

    if (
      Array.isArray(existenCollections) &&
      existenCollections.length === 1 &&
      existenCollections[0].collection_id === this.data.collectionId
    ) {
      const existenCollection = existenCollections[0];
      await collectionDB.modify({
        sequelize: this.sequelize,
        collection: {
          ...existenCollection,
          ...collection,
        },
      });
    } else {
      await collectionDB.add({
        collection,
        sequelize: this.sequelize
      });
    }
  }  
}

module.exports = { CreateCollection };