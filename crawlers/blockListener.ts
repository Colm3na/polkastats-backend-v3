import { Logger, pino } from 'pino';
import { EventFacade } from './eventFacade';
import { BridgeAPI } from '../lib/providerAPI/bridgeApi';
import extrinsic from '../lib/extrinsics';
import eventsData from '../lib/eventsData.js';
import eventsDB from '../lib/eventsDB.js';
import blockDB from '../lib/blockDB.js';
import blockData from '../lib/blockData.js';
import collectionStatsDB from '../lib/collectionsStatsDB';
import { ICrawlerModuleConstructorArgs } from './../config/config';
import { OpalAPI } from 'lib/providerAPI/bridgeProviderAPI/concreate/opalAPI';
import { TestnetAPI } from 'lib/providerAPI/bridgeProviderAPI/concreate/testnetAPI';
import { ApiPromise } from '@polkadot/api';
import { Sequelize } from 'sequelize/types';

const loggerOptions = {
  crawler: `blockListener`,
};

export class BlockListener {
  private logger: Logger;
  private bridgeApi: OpalAPI | TestnetAPI;
  private eventFacade: EventFacade;

  constructor(
    private api: ApiPromise,
    private sequelize: Sequelize,
  ) {
    this.logger = pino({ name: this.constructor.name });
    this.bridgeApi = new BridgeAPI(api).bridgeAPI;
    this.eventFacade = new EventFacade(this.bridgeApi, this.sequelize);
  }

  async startBlockListening(): Promise<void> {
    this.logger.info('Block listening was started');
    await this.bridgeApi.api.rpc.chain.subscribeNewHeads(async (header) => {
      const blockNumber = header.number.toNumber();
      this.logger.debug(`New block received #${blockNumber} has hash ${header.hash}`);
      await this.blockProcessing(blockNumber);
    });
  }

  async blockProcessing(blockNumber: number): Promise<void> {
    const blockData = await this.getBlockData(blockNumber);
    const events = await eventsData.get({
      bridgeAPI: this.bridgeApi,
      blockHash: blockData.blockHash,
    });
    const timestampMs = Number(await this.bridgeApi.api.query.timestamp.now.at(blockData.blockHash));
    const sessionLength = (this.bridgeApi.api.consts?.babe?.epochDuration || 0).toString();

    // const transaction = this.sequelize.transaction();
    await blockDB.save({
      blockNumber,
      block: Object.assign(blockData, events, { timestampMs, sessionLength }),
      sequelize: this.sequelize,
    });

    await extrinsic.save(
      this.sequelize,
      blockNumber,
      blockData.extrinsics,
      events.blockEvents,
      timestampMs,
      loggerOptions
    );

    await this.saveEvents(events, blockNumber, timestampMs);
  }

  async saveEvents(events: any, blockNumber: number, timestampMs): Promise<void> {
    events.blockEvents.forEach(async (record, index) => {
      const preEvent = Object.assign(
        {
          block_number: blockNumber,
          event_index: index,
          timestamp: Math.floor(timestampMs / 1000),
        },
        eventsData.parseRecord({ ...record, blockNumber })
      );
      
      await eventsDB.save({ event: preEvent, sequelize: this.sequelize });
      await collectionStatsDB.increaseActionsCount(this.sequelize, preEvent);
      this.logger.info(
        `Added event #${blockNumber}-${index} ${preEvent.section} ➡ ${preEvent.method}`
      );

      if (preEvent.section !== 'balances') {
        this.eventFacade.save({
          type: preEvent.method,
          data: preEvent._event.data.toJSON(),
          timestamp: preEvent.timestamp,
        });
      }
    });
  }

  async getBlockData(blockNumber: number) {
    return blockData.get({
      blockNumber,
      bridgeAPI: this.bridgeApi,
    });
  }
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const blockListener = new BlockListener(api, sequelize);
  await blockListener.startBlockListening();
}
