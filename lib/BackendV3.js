const pino = require('pino');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Pool } = require('pg');
const { wait } = require('./utils.js');
const { types } = require('./types/equilibrium.js');

const logger = pino();

class BackendV3 {
  constructor(config) {
    this.config = config;
    this.nodeisSyncing = true;
  }

  async runCrawlers() {
    logger.info('Starting backend, waiting 15s...');
    await wait(15000);

    const pool = await this.getPool();

    let api = await this.getPolkadotAPI();
    while (!api) {
      await wait(10000);
      api = await this.getPolkadotAPI();
    }

    logger.info('Running crawlers');

    this.config.crawlers
      .filter(crawler => crawler.enabled)
      .forEach(crawler => crawler.module.start(api, pool, crawler.config, this.config.substrateNetwork));
  }

  async getPolkadotAPI() {
    logger.info(`Connecting to ${this.config.wsProviderUrl}`);

    const provider = new WsProvider(this.config.wsProviderUrl);
    
    let api;

    if (this.config.substrateNetwork === 'equilibrium') {
      api = await ApiPromise.create({ provider, types: types });
    } else {
      api = await ApiPromise.create({ provider });
    }
    
    
    await api.isReady;

    logger.info('API is ready!');

    // Wait for node is synced
    let node;
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

  async getPool() {
    const pool = new Pool(this.config.postgresConnParams);
    await pool.connect();
    return pool;
  }
}

module.exports = BackendV3;
