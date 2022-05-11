import { Sequelize, Transaction } from 'sequelize/types';
import { bufferToJSON } from '../../utils/utils';
import  protobuf from '../../utils/protobuf';
import { OpalAPI } from '../../lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from '../../lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import { Root } from 'protobufjs';
import collectionDB from '../../lib/collectionDB';
import eventsDB from '../../lib/eventsDB';
import { EventTypes } from './type';


export class EventToken {
  constructor (
    protected bridgeAPI: OpalAPI | TestnetAPI,
    protected sequelize: Sequelize,
    public collectionId: number,
    public tokenId: number,
    public timestamp: number,
  ) {
    if (!this.collectionId || !this.tokenId) {
      throw new Error(`Can't create/modify token without collectionId(${this.collectionId}) or tokenId(${this.tokenId})`);
    }
  }

  public async save(transaction: Transaction): Promise<void> {}

  public async getToken(): Promise<any> {
    const token = await this.bridgeAPI.getToken(this.collectionId, this.tokenId);
    const tokenSchema = await this.getTokenSchema();
    return {
      collectionId: this.collectionId,
      tokenId: this.tokenId,
      owner: token.Owner,
      dateOfCreation: this.timestamp,
      data: this.getConstData(token.ConstData, tokenSchema),
    };
  }
  
  private parseConstData(constData, schema) {
    const buffer = Buffer.from(constData.replace('0x', ''), 'hex');
    if (buffer.toString().length !== 0 && constData.replace('0x', '') && schema !== null) {
      return {
        constData,
        buffer,
        locale: 'en',
        root: schema,
      };
    }

    return { constData };
  }

  private getDeserializeConstData(statement) {
    let result = {};
    if ('buffer' in statement) {
      try {
        return protobuf.deserializeNFT(statement);
      } catch (error) {
        console.error(error);
        return {
          hex: statement.constData?.toString().replace('0x', '') || statement.constData
        }
      }
    }

    return result;
  }

  private getConstData(constData, schema) {
    const statement = this.parseConstData(constData, schema);
    return JSON.stringify(this.getDeserializeConstData(statement));
  }

  private async getTokenSchema(): Promise<Root> {
    const collectionFromDB = await collectionDB.get({
      collectionId: this.collectionId,
      selectList: ['collection_id', 'const_chain_schema'],
      sequelize: this.sequelize
    });

    if (collectionFromDB) {
      return protobuf.getProtoBufRoot(collectionFromDB.const_chain_schema);
    }

    const collection = await this.bridgeAPI.getCollection(this.collectionId);
    return protobuf.getProtoBufRoot(bufferToJSON(collection.ConstOnChainSchema));
  }

  protected async canSave(): Promise<boolean> {
    const destroyTokenEvent = await eventsDB.getTokenEvent(
      this.sequelize,
      this.collectionId,
      this.tokenId,
      EventTypes.TYPE_ITEM_DESTROYED,
    );

    const destroyCollectionEvent = await eventsDB.getCollectionEvent(
      this.sequelize,
      this.collectionId,
      EventTypes.TYPE_COLLECTION_DESTROYED,
    );

    return !destroyTokenEvent && !destroyCollectionEvent;
  }
}
