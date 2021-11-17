const collectionDB = require('../collectionDB');
const { Events } = require('./events.js');
const protobuf = require('../../utils/protobuf.js');
const tokenData = require('../tokenData.js');


class EventToken extends Events {
  async getToken() {
    let result = null;
    if (this.data.collectionId) {
      const collection = await collectionDB.get({
        collectionId: this.data.collectionId,
        selectList: ['collection_id', 'const_chain_schema'],
        sequelize: this.sequelize
      });
      const statement = {};
      
      statement.tokenId = this.data.tokenId;
      statement.collection = Object.assign({}, {
        collectionId: collection.collection_id,
        schema: protobuf.getProtoBufRoot(collection.const_chain_schema)
      });
      statement.bridgeApi = this.bridgeApi;

      return await tokenData.get(statement);
    }
    return result;
  }
}

module.exports = { EventToken };