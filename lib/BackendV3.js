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
  }

  async runCrawlers() {
    const pool = await this.getPool();

    let api = await this.getPolkadotAPI();
    while (!api) {
      await wait(10000);
      api = await this.getPolkadotAPI();
    }

    console.log(`[PolkaStats backend v3] - \x1b[32mRunning crawlers\x1b[0m`);

    if (this.config.blockListener && this.config.blockListener.enabled) {
      blockListener(api, pool, this.config.blockListener);
    }

    if (this.config.rewards && this.config.rewards.enabled) {
      rewards(api, pool, this.config.rewards);
    }

    if (this.config.blockHarvester && this.config.blockHarvester.enabled) {
      blockHarvester(api, pool, this.config.blockHarvester);
    }

    if (this.config.accounts && this.config.accounts.enabled) {
      activeAccounts(api, pool, this.config.accounts);
    }

    if (this.config.staking && this.config.staking.enabled) {
      staking(api, pool, this.config.staking);
    }

    if (this.config.phragmen && this.config.phragmen.enabled) {
      phragmen(api, pool, {
        ...this.config.phragmen,
        wsProviderUrl: this.config.wsProviderUrl,
      });
    }
  }

  async getPolkadotAPI() {
    console.log(
      `[PolkaStats backend v3] - \x1b[32mConnecting to ${this.config.crawlerRunner.wsProviderUrl}\x1b[0m`,
    );

    const provider = new WsProvider(this.config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    console.log(`[PolkaStats backend v3] - \x1b[32mAPI is ready!\x1b[0m`);

    // Wait for node is synced
    let node;
    try {
      node = await api.rpc.system.health();
    } catch (_err) {
      console.log(
        `[PolkaStats backend v3] - \x1b[31mCan't connect to node! Waiting 10s...\x1b[0m`,
      );
      api.disconnect();
      await wait(10000);

      return false;
    }

    console.log(
      `[PolkaStats backend v3] - \x1b[32mNode: ${JSON.stringify(node)}\x1b[0m`,
    );

    if (node && node.isSyncing.eq(false)) {
      // Node is synced!
      console.log(`[PolkaStats backend v3] - \x1b[32mNode is synced!\x1b[0m`);
      this.nodeisSyncing = false;

      return api;
    } else {
      console.log(
        `[PolkaStats backend v3] - \x1b[33mNode is not synced! Waiting 10s...\x1b[0m`,
      );
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
