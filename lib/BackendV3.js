// @ts-check

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Pool } = require('pg');
const { subscribeToNewBlocks } = require('./crawlers/subscribeToNewBlocks.js');
const { blockHarvester } = require('./crawlers/blockHarvester.js');
const { shortHash } = require('./utils.js');


class BackendV3 {
  constructor(config) {
    this.config = config;
    this.nodeisSyncing = true;
    this.runCrawlers();
  }
  async runCrawlers() {
    console.log(`[PolkaStats backend v3] - \x1b[32mRunning crawlers\x1b[0m`);
    const api = await this.getPolkadotAPI();
    const pool = await this.getPool();
    // This crawler listen to new blocks and system events and add them to database
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting block listener...\x1b[0m`);
    subscribeToNewBlocks(api, pool);
    // This crawler fill the gaps in block and event tables
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting block harvester...\x1b[0m`);
    blockHarvester(api, pool, this.config);
  }
  async getPolkadotAPI() {
    console.log(`[PolkaStats backend v3] - \x1b[32mConnecting to node ${this.config.wsProviderUrl}\x1b[0m`);
    const provider = new WsProvider(this.config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;

    // Wait for node is synced
    let node;
    try {
      node = await api.rpc.system.health();
    } catch {
      console.log(`[PolkaStats backend v3] - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
      setTimeout(this.getPolkadotAPI, 10000);
    }
    if (node.isSyncing.eq(false)) {
      // Node is synced!
      console.log(`[PolkaStats backend v3] - \x1b[32mNode is synced!\x1b[0m`);
      this.nodeisSyncing = false;
      return api;
    } else {
      console.log(`[PolkaStats backend v3] - \x1b[33mNode is not synced! Waiting 10s...\x1b[0m`);
      setTimeout(this.getPolkadotAPI, 10000);
    }
  }
  async getPool() {
    const pool = new Pool(this.config.postgresConnParams);
    await pool.connect();
    return pool;
  }


  

}

module.exports = BackendV3;