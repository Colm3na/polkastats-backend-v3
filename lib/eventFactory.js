const collection = require('./eventFactory/collection.js');
const token = require('./eventFactory/token.js');
const eventTypes = require('./eventFactory/type.js');


class EventFactory {
  constructor({
    bridgeAPI, sequelize, data, type
  }) {
      this.bridgeAPI = bridgeAPI;
      this.event = this.getEvent(this.bridgeAPI, sequelize, data, type);
}

  getEvent(bridgeAPI, sequelize, data, type) {
    switch (type) {
      case eventTypes.TYPE_CREATE_COLLECTION:
        return new collection.create(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_CREATE_TOKEN:
        return new token.create(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_ITEM_DESTROYED:
        return new token.destroyed(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_TRANSFER:
        return new token.transfer(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_DESTROYED:
        return new collection.destroyed(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_SPONSOR_REMOVED:
        return new collection.removeSponsor(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_ADMIN_ADDED:
        return new collection.addAdmin(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_OWNED_CHANGED:
        return new collection.changeOwner(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_SPONSORSHIP_CONFIRMED:
        return new collection.confirmSponsorship(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_ADMIN_REMOVED:
        return new collection.removeAdmin(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_ALLOWLISTADDRESS_REMOVED:
      case eventTypes.TYPE_ALLOWLISTADDRESS_ADDED:
      case eventTypes.TYPE_COLLECTION_LIMIT_SET:
        return new collection.setLimits(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_COLLECTION_SPONSOR_SET:
      case eventTypes.TYPE_CONST_ON_CHAIN_SCHEMA_SET:
        return new collection.setConstSchema(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_MINT_PERMISSION_SET:
        return new collection.setMintPermission(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_OFFCHAIN_SCHEMA_SET:
        return new collection.setOffchainSchema(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_PUBLIC_ACCESS_MODE_SET:
      case eventTypes.TYPE_SCHEMA_VERSION_SET:
        return new collection.setSchemaVersion(bridgeAPI, sequelize, data);
      case eventTypes.TYPE_VARIABLE_ONCHAIN_SCHEMA_SET:
        return new collection.setVariableSchema(bridgeAPI, sequelize, data);
      default:
        throw new Error(`unknow type ${type}`);
    }
  }

  async save() {
    await this.event.save();
  }
}

module.exports = { EventFactory };