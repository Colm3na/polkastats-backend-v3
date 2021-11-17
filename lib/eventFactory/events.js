class Events {
  constructor (bridgeApi, sequelize, data = []) {
    this.bridgeApi = bridgeApi;
    this.sequelize = sequelize;
    this._data = data;
  }

  save() {
    throw new Error('sublcass responsibility')
  }
  
  get data() {
    const result = {};
    result.collectionId = this._data[0] || null;
    result.tokenId = this._data[1] || null;
    result.sender = this._data[3] || null;
    return result;
  }
}

module.exports = { Events };