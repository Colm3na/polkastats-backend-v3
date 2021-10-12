import { Logger } from './../utils/logger.js';

const log = new Logger();

export class BlockExplorer {
  #api = null;
  #sequelize = null;
  #crawlers = null;

  constructor({api, sequelize, crawlers}) {
    this.#api = api;
    this.#sequelize = sequelize;
    this.#crawlers = crawlers;
  }

  async run() {
    log.info('Starting backend, waiting 15s...');
    this.#crawlers.filter((crawler) => crawler.enabled)
    .forEach(async (crawler) => {      
      const { start } = await import(crawler.module);
      await start({
        api: this.#api,
        sequelize: this.#sequelize,
        config: crawler.config
      })
    })
  }
}