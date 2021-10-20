import { getCollection, saveCollection } from './collectionListener.js'
import { getToken, checkToken, saveToken, deleteToken, moveToken } from './tokenListener.js'
import lodash from 'lodash'


const TYPE_CREATE_COLLECTION = 'CollectionCreated'
const TYPE_CREATE_TOKEN = 'ItemCreated'
const TYPE_ITEM_DESTROYED = 'ItemDestroyed'
const TYPE_TRANSFARE = 'Transfer'

const { isNumber } = lodash;

export class EventFacade {
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
    switch (type) {
      case TYPE_CREATE_COLLECTION: {
        return await this.saveCollection(data)
      }

      case TYPE_CREATE_TOKEN: {
        return await this.insertToken(data)
      }

      case TYPE_ITEM_DESTROYED: {
        return await this.delToken(data)
      }

      case TYPE_TRANSFARE: {
        return await this.transferToken(data)
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
  async saveCollection(data) {          
    const collectionId = data[0];        
    if (isNumber(collectionId)) {
      const collection = await getCollection(this.api, collectionId);      
      await saveCollection({
        collection,
        sequelize: this.sequelize
      })
    }
    return null;
  }

  async insertToken(data) {    
    if (this.#checkNumber(this.#parseData(data))) {
      const token = await getToken({api:this.api, ...this.#parseData(data)});
      const check = await checkToken(this.sequelize, token);      
      await saveToken(this.sequelize,{...token, check});              
    }
  }

  #checkNumber({collectionId, tokenId}) {
    return isNumber(collectionId) && isNumber(tokenId);
  }

  async delToken(data) {    
    if (this.#checkNumber(this.#parseData(data))) {
      await deleteToken({sequelize: this.sequelize, ...this.#parseData(data)})
    }
  }

  async transferToken(data) {    
    if (this.#checkNumber(this.#parseData(data))) {
      await moveToken({
        sequelize: this.sequelize,
        ...this.#parseData(data),
        ...this.#parseOwners(data)
      });
    }
  }

  #parseOwners(data) {    
    const sender = data[3];
    return { sender };
  }

  #parseData(data) {
    const tokenId = data[1];
    const collectionId = data[0];
    return { collectionId, tokenId };
  }
}