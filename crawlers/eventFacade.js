const { EventFactory } = require('../lib/eventFactory.js');
class EventFacade {
  /**
   * 
   * @param {string} type event.method 
   * @param {ApiPromise} api
   */
  constructor(bridgeAPI, sequelize) {    
    this.bridgeAPI = bridgeAPI
    this.sequelize = sequelize
  }  
  /**
   * 
   * @param {Array} data event.data
   * @returns 
   */
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

module.exports = { EventFacade }