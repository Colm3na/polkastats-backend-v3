import { OpalAPI } from '../lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from '../lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import { EventFactory } from '../lib/eventFactory';
import { Sequelize } from 'sequelize/types';

export class EventFacade {
  bridgeAPI: OpalAPI | TestnetAPI;
  sequelize: Sequelize;

  constructor(bridgeAPI, sequelize) {    
    this.bridgeAPI = bridgeAPI
    this.sequelize = sequelize
  }  

  async save({ type, data, timestamp, transaction }) {
    const event = new EventFactory(
      this.bridgeAPI,
      this.sequelize,
      data,
      type,
      timestamp,
    );
    await event.save(transaction);
  }
}
