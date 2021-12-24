const { EventCollection } = require('./eventCollection.js');


class EventAccountCollection extends EventCollection {
  get data() {
    const result = {};
    result.collectionId = this._data[0] || null;
    result.accountId = this._data[1] || null;    
    return result;
  }
}

module.exports = { EventAccountCollection };