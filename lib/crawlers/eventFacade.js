const _ = require('lodash');
const { getCollection, saveCollection } = require('./collectionListener');

const TYPE_CREATE_COLLECTION = 'CollectionCreated'


class EventFacade {
  /**
   * 
   * @param {string} type event.method 
   * @param {ApiPromise} api
   */
  constructor(type, api, pool) {
    this.type = type
    this.api = api
    this.pool = pool
  }
  /**
   * 
   * @param {Array} data event.data
   * @returns 
   */
  async save(data) {
    const eventData = data.toJSON()
    switch (this.type) {

      case TYPE_CREATE_COLLECTION: {                
        const collectionId = _.head(eventData); //collection id
        return await this.#saveCollection(collectionId)
      }

      
      default: {
        return null;
      }
    }
  }
  /**
   * 
   * @param {number} collectionId 
   * @returns 
   */
  async #saveCollection(collectionId) {
    if (_.isNumber(collectionId)) {
      const collection = await getCollection(this.api, collectionId);
      await saveCollection({
        collection,
        pool: this.pool
      })
    }
    return null;
  }
}

module.exports = EventFacade;