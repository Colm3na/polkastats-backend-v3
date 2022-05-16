import blockDB from '../lib/blockDB';
import { ICrawlerModuleConstructorArgs } from '../config/config';
import { BlockListener } from './blockListener';
import { ApiPromise } from '@polkadot/api';
import { Sequelize } from 'sequelize/types';

class Rescanner extends BlockListener {
  constructor(
    protected api: ApiPromise,
    protected sequelize: Sequelize,
    readonly COUNT_OF_BLOCKS: number,
  ) {
    super(api, sequelize);
  }

  private async getBlocks(): Promise<any[]> {
    return blockDB.getBlocksForRescan({
      sequelize: this.sequelize,
      limit: this.COUNT_OF_BLOCKS,
    });
  }

  public async rescan(): Promise<void> {
    const blocks = await this.getBlocks();

    if (blocks.length === 0) {
      return;
    }

    await Promise.all(blocks.map((block) => this.blockProcessing(block.block_number)));
    await this.rescan();
  }
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const rescanner = new Rescanner(api, sequelize, config.countOfParallelTasks);
  await rescanner.rescan();
}