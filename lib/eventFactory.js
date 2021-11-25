const { CreateCollection } = require("./eventFactory/createCollection")
const { CreateToken } = require("./eventFactory/createToken.js")
const { TransferToken } = require("./eventFactory/transferToken.js")
const { DestroyedToken } = require("./eventFactory/destroyedToken.js");
const { BridgeAPI } = require("./providerAPI/bridgeApi");

const TYPE_CREATE_COLLECTION = 'CollectionCreated'
const TYPE_CREATE_TOKEN = 'ItemCreated'
const TYPE_ITEM_DESTROYED = 'ItemDestroyed'
const TYPE_TRANSFARE = 'Transfer'

class EventFactory {
  constructor({
    bridgeAPI, sequelize, data, type
  }) {              
      this.bridgeAPI = bridgeAPI;
      this.event = this.getEvent(this.bridgeAPI, sequelize, data, type);      
  }

  getEvent(bridgeAPI, sequelize, data, type) {    
    switch (type) {
      case TYPE_CREATE_COLLECTION: 
        return new CreateCollection(bridgeAPI, sequelize, data);
      case TYPE_CREATE_TOKEN: 
        return new CreateToken(bridgeAPI, sequelize, data);
      case TYPE_ITEM_DESTROYED: 
        return new DestroyedToken(bridgeAPI, sequelize, data);
      case TYPE_TRANSFARE: 
        return new TransferToken(bridgeAPI, sequelize, data);
      default:
        throw new Error(`unknow type ${type}`);        
    }
  }

  async save() {
    await this.event.save();
  }
}

module.exports = { EventFactory };