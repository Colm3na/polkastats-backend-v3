const { CreateCollection } = require("./EventFactory/createCollection")
const { CreateToken } = require("./EventFactory/createToken")
const { TransferToken } = require("./EventFactory/transferToken")
const { DestroyedToken } = require("./EventFactory/destroyedToken.js");

const TYPE_CREATE_COLLECTION = 'CollectionCreated'
const TYPE_CREATE_TOKEN = 'ItemCreated'
const TYPE_ITEM_DESTROYED = 'ItemDestroyed'
const TYPE_TRANSFARE = 'Transfer'

class EventFactory {
  constructor({
    api, sequelize, data, type
  }) {
     this.event = this.getEvent(api, sequelize, data, type);
  }

  getEvent(api, sequelize, data, type) {
    console.log('type->', type);
    switch (type) {
      case TYPE_CREATE_COLLECTION: 
        return new CreateCollection(api, sequelize, data);
      case TYPE_CREATE_TOKEN: 
        return new CreateToken(api, sequelize, data);
      case TYPE_ITEM_DESTROYED: 
        return new DestroyedToken(api, sequelize, data);
      case TYPE_TRANSFARE: 
        return new TransferToken(api, sequelize, data);
      default:
        throw new Error(`unknow type ${type}`);
    }
  }

  async save() {
    await this.event.save();
  }
}

module.exports = { EventFactory };