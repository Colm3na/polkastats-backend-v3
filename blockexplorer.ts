import { ApiPromise } from '@polkadot/api';
import { Sequelize } from 'sequelize/types';
import { ICrawlerModule } from './config/config.js';
import { Logger } from './utils/logger.js';

const log = new Logger();

export class BlockExplorer {
  constructor(
    private api: ApiPromise,
    private sequelize: Sequelize,
    private crawlers: ICrawlerModule[],
  ) {}

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
