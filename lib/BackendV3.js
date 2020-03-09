// @ts-check

const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Pool } = require('pg');
const { blockListener } = require('./crawlers/blockListener.js');
const { blockHarvester } = require('./crawlers/blockHarvester.js');
const { activeAccounts } = require('./crawlers/activeAccounts.js');
const { staking } = require('./crawlers/staking.js');
const { rewards } = require('./crawlers/rewards.js');
const { phragmen } = require('./crawlers/phragmen.js');
const { wait } = require('./utils.js');

class BackendV3 {
  constructor(config) {
    this.config = config;
    this.nodeisSyncing = true;
    this.runCrawlers();
  }
  async runCrawlers() {
    let api;
    api = await this.getPolkadotAPI();
    while (!api) {
      await wait(10000);
      api = await this.getPolkadotAPI();
    }
    const pool = await this.getPool();
    console.log(`[PolkaStats backend v3] - \x1b[32mRunning crawlers\x1b[0m`);
    // Listen to new blocks and system events and add them to database
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting block listener...\x1b[0m`);
    blockListener(api, pool);
    // Get rewards
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting rewards crawler...\x1b[0m`);
    rewards(api, pool);
    // Fill the gaps in block and event tables
    setTimeout(function(){
      console.log(`[PolkaStats backend v3] - \x1b[32mStarting block harvester...\x1b[0m`);
      blockHarvester(api, pool, this.config);
    }, this.config.BLOCK_HARVESTER_POLLING_TIME);
    // Get information about active accounts
    setTimeout(function(){
      console.log(`[PolkaStats backend v3] - \x1b[32mStarting active accounts crawler...\x1b[0m`);
      activeAccounts(api, pool, this.config);
    }, this.config.ACTIVE_ACCOUNTS_POLLING_TIME);
    // Get offline phragmen output
    setTimeout(function(){
      console.log(`[PolkaStats backend v3] - \x1b[32mStarting phragmen crawler...\x1b[0m`);
      phragmen(api, pool, this.config);
    }, this.config.PHRAGMEN_POLLING_TIME);
    // Get staking info
    setTimeout(function(){
      console.log(`[PolkaStats backend v3] - \x1b[32mStarting staking crawler...\x1b[0m`);
      staking(api, pool);
    }, this.config.STAKING_POLLING_TIME);
    
  }
  async getPolkadotAPI() {
    console.log(`[PolkaStats backend v3] - \x1b[32mConnecting to ${this.config.wsProviderUrl}\x1b[0m`);
    const provider = new WsProvider(this.config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log(`[PolkaStats backend v3] - \x1b[33mAPI is ready!\x1b[0m`);

    // Wait for node is synced
    let node;
    try {
      node = await api.rpc.system.health();
    } catch {
      console.log(`[PolkaStats backend v3] - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
      await wait(10000);
      return false;
    }

    console.log(`[PolkaStats backend v3] - \x1b[33mNode: ${JSON.stringify(node)}\x1b[0m`);

    if (node && node.isSyncing.eq(false)) {
      // Node is synced!
      console.log(`[PolkaStats backend v3] - \x1b[32mNode is synced!\x1b[0m`);
      this.nodeisSyncing = false;
      return api;
    } else {
      console.log(`[PolkaStats backend v3] - \x1b[33mNode is not synced! Waiting 10s...\x1b[0m`);
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