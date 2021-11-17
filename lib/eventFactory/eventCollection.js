const { Events } = require('./events.js');
const collectionData = require('../collectionData.js');

class EventCollection extends Events {
  async getCollection() {
    let result = null;
    if (this.data.collectionId) {
      result = await collectionData.get(
        this.data.collectionId,
        this.bridgeApi
      )
    }
    return result;
  }
}

module.exports = { EventCollection };