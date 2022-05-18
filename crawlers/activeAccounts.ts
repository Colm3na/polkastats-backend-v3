import { ICrawlerModuleConstructorArgs } from '../config/config';
import pino, { Logger } from 'pino';
import { ApiPromise } from '@polkadot/api';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { getAmount, normalizeSubstrateAddress } from '../utils/utils';

export interface IAccount {
  id: string;
  balances: string;
  availableBalance: string;
  freeBalance: string;
  lockedBalance: string;
  nonce: string;
}

class AccountsCrawler {
  private logger: Logger;

  constructor(
    private api: ApiPromise,
    private sequelize: Sequelize,
    readonly PARALLEL_TASKS: number,
  ) {
    this.logger = pino({ name: this.constructor.name });
  }

  private async getAccountsIds(): Promise<string[]> {
    const accounts =  await this.api.query.system.account.keys();
    const accountsIds = accounts.map((account) => account.args[0].toString());
    return accountsIds;
  }

  private async getAccountBalances(accountId: string) {
    const balances = await this.api.derive.balances.all(accountId);
    return {
      balances: JSON.stringify(balances),
      availableBalance: getAmount(balances.availableBalance.toString()),
      freeBalance: getAmount(balances.freeBalance.toString()),
      lockedBalance: balances.lockedBalance.toString(),
      nonce: balances.accountNonce.toString(),
    }
  }

  private async getCurrentBlockNumber(): Promise<number> {
    const { block } = await this.api.rpc.chain.getBlock();
    return block.header.number.toNumber();
  }

  public async start(): Promise<void> {
    this.logger.info(`Running active accounts crawler with ${this.PARALLEL_TASKS} parallel tasks...`);

    const currentBlockNumber = await this.getCurrentBlockNumber();
    const accountsIds = await this.getAccountsIds();
    const countOfAccounts = accountsIds.length;
    const transaction = await this.sequelize.transaction();

    try {
      while (accountsIds.length > 0) {
        await Promise.all(
          accountsIds
            .splice(0, this.PARALLEL_TASKS)
            .map((accountId) => this.accountProcessing(accountId, currentBlockNumber, transaction)),
        );
      }
      transaction.commit();
    } catch (e) {
      transaction.rollback();
      this.logger.error(e);
    }

    this.logger.info(`Processed ${countOfAccounts} active accounts`);
  }

  private async accountProcessing(accountId: string, currentBlockNumber: number, transaction: Transaction): Promise<void> {
    this.logger.debug(`Processing account: ${accountId}`);
    const accountBalances = await this.getAccountBalances(accountId);
    return this.save(
      {
        id: accountId,
        ...accountBalances,
      },
      currentBlockNumber,
      transaction,
    );
  }

  private async save(account: IAccount, currentBlockNumber: number, transaction: Transaction): Promise<void> {
    const timestamp = new Date().getTime() / 1000;
    const query = `
      INSERT INTO account (account_id, account_id_normalized, balances, available_balance, free_balance, locked_balance, nonce, timestamp, block_height)
      VALUES(:account_id, :account_id_normalized, :balances, :available_balance, :free_balance, :locked_balance, :nonce, :timestamp, :block_height) 
        ON CONFLICT ON CONSTRAINT account_pkey
        DO UPDATE
        SET
        balances = :balances,
        available_balance = :available_balance, 
        free_balance = :free_balance,
        locked_balance = :locked_balance,
        nonce = :nonce,
        timestamp = :timestamp,
        block_height = :block_height;
    `;

    await this.sequelize.query(query,
      {
        type: QueryTypes.INSERT,
        logging: false,
        transaction,
        replacements: {
          account_id: account.id,
          account_id_normalized: normalizeSubstrateAddress(account.id),
          balances: account.balances,
          available_balance: account.availableBalance,
          free_balance: account.freeBalance,
          locked_balance: account.lockedBalance,
          nonce: account.nonce,
          timestamp,
          block_height: currentBlockNumber,
        },
      }
    );
  }
}

export async function start({ api, sequelize, config }: ICrawlerModuleConstructorArgs) {
  const crawler = new AccountsCrawler(api, sequelize, config.countOfParallelTasks);

  (async function run() {
    await crawler.start();
    setTimeout(() => run(), config.pollingTime);
  })();
}
