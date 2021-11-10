const { EventFactory } = require('../lib/eventFactory.js');
class EventFacade {
  /**
   * 
   * @param {string} type event.method 
   * @param {ApiPromise} api
   */
  constructor(api, sequelize) {    
    this.api = api
    this.sequelize = sequelize
  }  
  /**
   * 
   * @param {Array} data event.data
   * @returns 
   */
  async save(type, data) {
    const event = new EventFactory({
      api: this.api,
      sequelize: this.sequelize,
      data,
      type
    });
    await event.save();
  }
}

module.exports = { EventFacade }