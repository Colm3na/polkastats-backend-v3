// @ts-check

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Pool } = require('pg');
const { wait } = require('./utils.js');

class BackendV3 {
  constructor(config) {
    this.config = config;
    this.nodeisSyncing = true;
  }

  async runCrawlers() {

    console.log(`[PolkaStats backend v3] - \x1b[32mStarting backend, waiting 15s...\x1b[0m`);
    await wait(15000);

    const pool = await this.getPool();

    let api = await this.getPolkadotAPI();
    while (!api) {
      await wait(10000);
      api = await this.getPolkadotAPI();
    }

    console.log(`[PolkaStats backend v3] - \x1b[32mRunning crawlers\x1b[0m`);

    this.config.crawlers
      .filter(crawler => crawler.enabled)
      .forEach(crawler => crawler.module.start(api, pool, crawler.config));
    }

  async getPolkadotAPI() {
    console.log(`[PolkaStats backend v3] - \x1b[32mConnecting to ${this.config.wsProviderUrl}\x1b[0m`);

    const provider = new WsProvider(this.config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log(`[PolkaStats backend v3] - \x1b[32mAPI is ready!\x1b[0m`);

    // Wait for node is synced
    let node;
    try {
      node = await api.rpc.system.health();
    } catch {
      console.log(`[PolkaStats backend v3] - \x1b[31mCan't connect to node! Waiting 10s...\x1b[0m`);
      api.disconnect();
      await wait(10000);
      return false;
    }

    console.log(`[PolkaStats backend v3] - \x1b[32mNode: ${JSON.stringify(node)}\x1b[0m`);

    if (node && node.isSyncing.eq(false)) {
      // Node is synced!
      console.log(`[PolkaStats backend v3] - \x1b[32mNode is synced!\x1b[0m`);
      this.nodeisSyncing = false;
      return api;
    } else {
      console.log(`[PolkaStats backend v3] - \x1b[33mNode is not synced! Waiting 10s...\x1b[0m`);
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
