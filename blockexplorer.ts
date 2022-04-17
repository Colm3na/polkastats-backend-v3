import { Sequelize } from 'sequelize/types';
import { ICrawlerModule } from './config/config.js';
import { Logger } from './utils/logger.js';

const log = new Logger();

export class BlockExplorer {
  private api;
  private sequelize;
  private crawlers: ICrawlerModule[];

  constructor({ api, sequelize, crawlers }: { api: any, sequelize: Sequelize, crawlers: ICrawlerModule[] }) {
    this.api = api;
    this.sequelize = sequelize;
    this.crawlers = crawlers;
  }

  async run() {
    this.crawlers.filter((crawler) => crawler.enabled)
      .forEach(async (crawler) => {
        await crawler.start({
          api: this.api,
          sequelize: this.sequelize,
          config: crawler.config,
        });
      });
  }
}
