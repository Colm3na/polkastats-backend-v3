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
    this.#crawlers.filter((crawler) => crawler.enabled)
    .forEach(async (crawler) => {      
      const { start } = await import(crawler.module);
      log.green(crawler.module);
      await start({
        api: this.#api,
        sequelize: this.#sequelize,
        config: crawler.config
      })
    })
  }
}