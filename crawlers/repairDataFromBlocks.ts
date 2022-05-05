import blockDB from '../lib/blockDB';
import { ICrawlerModuleConstructorArgs } from '../config/config';
import { BlockListener } from './blockListener';

class Rescanner extends BlockListener {
  private async getBlocks(): Promise<any[]> {
    return blockDB.getBlocksForRescan({ sequelize: this.sequelize });
  }

  public async rescan(): Promise<void> {
    const blocks = await this.getBlocks();

    if (blocks.length === 0) {
      return;
    }

    for (const block of blocks) {
      await this.blockProcessing(block.block_number);
    }

    await this.rescan();
  }
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const rescanner = new Rescanner(api, sequelize);
  await rescanner.rescan();
}