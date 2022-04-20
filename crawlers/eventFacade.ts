const { EventFactory } = require('../lib/eventFactory.js');
export class EventFacade {
  bridgeAPI;
  sequelize;

  constructor(bridgeAPI, sequelize) {    
    this.bridgeAPI = bridgeAPI
    this.sequelize = sequelize
  }  

  async save({ type, data, timestamp }) {
    try {
      const event = new EventFactory({
        bridgeAPI: this.bridgeAPI,
        sequelize: this.sequelize,
        data,
        type,
        timestamp,
      });
      await event.save();
    } catch (error) {
      console.error(error);
      return null;
    }    
  }
}
