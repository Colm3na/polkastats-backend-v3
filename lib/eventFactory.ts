import { Sequelize } from 'sequelize/types';
import collection from './eventFactory/collection';
import token from './eventFactory/token';
import { EventTypes } from './eventFactory/type';
import { OpalAPI } from './providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from './providerAPI/bridgeProviderAPI/concreate/testnetAPI';

export class EventFactory {
  event: any; //TODO Replace to TokenEvent | CollectionEvent

  constructor(
    private bridgeAPI: OpalAPI | TestnetAPI,
    private sequelize: Sequelize,
    data: any[],
    type: EventTypes,
    timestamp: number,
  ) {
    this.event = this.getEvent(this.bridgeAPI, sequelize, data, type, timestamp);
  }

  getEvent(bridgeAPI, sequelize, data, type, timestamp) {
    switch (type) {
      case EventTypes.TYPE_CREATE_COLLECTION:
        return new collection.create(bridgeAPI, sequelize, { ...data, date_of_creation: timestamp });
      case EventTypes.TYPE_CREATE_TOKEN:
        // data[0] - collection id
        // data[1] - token id
        bridgeAPI.getToken(data[0], data[1]).then((token) => console.log('token from API: ', token));
        return new token.create(bridgeAPI, sequelize, { ...data, date_of_creation: timestamp });
      case EventTypes.TYPE_ITEM_DESTROYED:
        return new token.destroyed(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_TRANSFER:
        return new token.transfer(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_DESTROYED:
        return new collection.destroyed(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_SPONSOR_REMOVED:
        return new collection.removeSponsor(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_ADMIN_ADDED:
        return new collection.addAdmin(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_OWNED_CHANGED:
        return new collection.changeOwner(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_SPONSORSHIP_CONFIRMED:
        return new collection.confirmSponsorship(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_ADMIN_REMOVED:
        return new collection.removeAdmin(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_ALLOWLISTADDRESS_REMOVED:
        return new collection.removeFromWhiteList(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_ALLOWLISTADDRESS_ADDED:
        return new collection.addToWhiteList(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_LIMIT_SET:
        return new collection.setLimits(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_COLLECTION_SPONSOR_SET:
        return new collection.setSponsor(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_CONST_ON_CHAIN_SCHEMA_SET:
        return new collection.setConstSchema(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_MINT_PERMISSION_SET:
        return new collection.setMintPermission(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_OFFCHAIN_SCHEMA_SET:
        return new collection.setOffchainSchema(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_PUBLIC_ACCESS_MODE_SET:
        return new collection.setPublicMode(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_SCHEMA_VERSION_SET:
        return new collection.setSchemaVersion(bridgeAPI, sequelize, data);
      case EventTypes.TYPE_VARIABLE_ONCHAIN_SCHEMA_SET:
        return new collection.setVariableSchema(bridgeAPI, sequelize, data);
      default:
        console.log(`Unknown type ${type}`);
    }
  }

  async save() {
    if (this.event) {
      await this.event.save();
    }
  }
}
