import blockDB from '../lib/blockDB';
import { ICrawlerModuleConstructorArgs } from '../config/config';
import { BlockListener } from './blockListener';

class Rescanner extends BlockListener {
  readonly COUNT_OF_BLOCKS = 20;

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
  const rescanner = new Rescanner(api, sequelize);
  await rescanner.rescan();
}