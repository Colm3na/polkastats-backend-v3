import { IConfig } from './types/type';
import pino from 'pino'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Pool } from 'pg'
import { wait } from './lib/utils'
import rtt from './config/runtime_types.json'

const logger = pino()

export default class BackendV3 {
  config: IConfig
  nodeisSyncing: boolean
    
  constructor( config: IConfig ) {
    this.config = config
    this.nodeisSyncing = true
  }

  async runCrawlers(): Promise<void> {
    logger.info('Starting backend, waiting 15s...');
    //await wait(15000);

    const pool = await this.getPool();

    let api = await this.getPolkadotAPI();
    while (!api) {
      await wait(10000);
      api = await this.getPolkadotAPI();
    }

    logger.info('Running crawlers');

    this.config.crawlers
      .filter(item => item.enabled === true)
      .forEach(async (item) => {
        const { start } = await import(item.module)
        await start(api, pool, item.config, this.config.substrateNetwork)
      })    
  }

  async getPolkadotAPI(): Promise<ApiPromise | boolean> {
    
    logger.info(`Connecting to ${this.config.wsProviderUrl}`);

    const provider = new WsProvider(this.config.wsProviderUrl);

    const api = await ApiPromise.create({ provider, types: rtt });  

    api.on("error", async (value) => {      
      logger.error(value);
    });

    api.on("disconnected", async (value) => {
      logger.error(value);
    });

    await api.isReady;

    logger.info('API is ready!');

    // Wait for node is synced
    let node: any;
    try {
      node = await api.rpc.system.health();
    } catch {
      logger.error("Can't connect to node! Waiting 10s...");
      api.disconnect();
      await wait(10000);
      return false;
    }

    logger.info(`Node: ${JSON.stringify(node)}`);
    
    if (node && node.isSyncing.eq(false)) {
      // Node is synced!
      logger.info('Node is synced!');
      this.nodeisSyncing = false;
      return api;
    } else {
      logger.warn('Node is not synced! Waiting 10s...');
      api.disconnect();
      await wait(10000);
    }
    return false;
  }

  async getPool(): Promise<Pool> {
    const pool = new Pool(this.config.postgresConnParams)
    await pool.connect()
    return pool
  }
}