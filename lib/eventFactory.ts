import { Sequelize, Transaction } from 'sequelize/types';
import { CreateCollection } from './eventFactory/collection/createCollection';
import { DestroyCollection } from './eventFactory/collection/destroyCollection';
import { UpdateCollection } from './eventFactory/collection/updateCollection';
import { EventCollection } from './eventFactory/eventCollection';
import { EventToken } from './eventFactory/eventToken';
import { CreateToken } from './eventFactory/token/createToken';
import { DestroyToken } from './eventFactory/token/destroyToken';
import { TransferToken } from './eventFactory/token/transferToken';
import { EventTypes } from './eventFactory/type';
import { OpalAPI } from './providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from './providerAPI/bridgeProviderAPI/concreate/testnetAPI';

export class EventFactory {
  event: EventToken | EventCollection;

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
        return new CreateCollection(bridgeAPI, sequelize, data[0], timestamp);
      case EventTypes.TYPE_CREATE_TOKEN:
        return new CreateToken(bridgeAPI, sequelize, data[0], data[1], timestamp);
      case EventTypes.TYPE_ITEM_DESTROYED:
        return new DestroyToken(bridgeAPI, sequelize, data[0], data[1], timestamp);
      case EventTypes.TYPE_TRANSFER:
        return new TransferToken(bridgeAPI, sequelize, data[0], data[1], timestamp);
      case EventTypes.TYPE_COLLECTION_DESTROYED:
        return new DestroyCollection(bridgeAPI, sequelize, data[0], timestamp);
      case EventTypes.TYPE_COLLECTION_SPONSOR_REMOVED:
      case EventTypes.TYPE_COLLECTION_ADMIN_ADDED:
      case EventTypes.TYPE_COLLECTION_OWNED_CHANGED:
      case EventTypes.TYPE_SPONSORSHIP_CONFIRMED:
      case EventTypes.TYPE_COLLECTION_ADMIN_REMOVED:
      case EventTypes.TYPE_ALLOWLISTADDRESS_REMOVED:
      case EventTypes.TYPE_ALLOWLISTADDRESS_ADDED:
      case EventTypes.TYPE_COLLECTION_LIMIT_SET:
      case EventTypes.TYPE_COLLECTION_SPONSOR_SET:
      case EventTypes.TYPE_CONST_ON_CHAIN_SCHEMA_SET:
      case EventTypes.TYPE_MINT_PERMISSION_SET:
      case EventTypes.TYPE_OFFCHAIN_SCHEMA_SET:
      case EventTypes.TYPE_PUBLIC_ACCESS_MODE_SET:
      case EventTypes.TYPE_SCHEMA_VERSION_SET:
      case EventTypes.TYPE_VARIABLE_ONCHAIN_SCHEMA_SET:
        return new UpdateCollection(bridgeAPI, sequelize, data[0], timestamp);
      default:
        console.log(`Unknown type ${type}`);
    }
  }

  async save(transaction: Transaction) {
    if (this.event) {
      await this.event.save(transaction);
    }
  }
}
