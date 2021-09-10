// @ts-check
const { zip } = require('lodash');
const DEFAULT_POLLING_TIME_MS = 1 * 60 * 1000;
const pino = require('pino');
const logger = pino();

const loggerOptions = {
  crawler: `activeAccounts`
};

const getAccountId = account =>
  account
    .map(e => e.args)
    .map(([e]) => e)
    .map(e => e.toHuman());

const fetchBlockNumber = async api => {
  const { block } = await api.rpc.chain.getBlock();
  return block.header.number.toNumber();
};

const fetchAccountIds = async api => {
  return getAccountId(await api.query.system.account.keys());
};

const fetchAccountIdentity = async (accountId, api) => {
  const info = await api.derive.accounts.info(accountId);
  return info.identity;
};

const fetchValidators = async api => {
  const validators = await api.query.staking.validators.keys();
  return getAccountId(validators);
};

const fetchAccountStaking = async (accountId, api, validators) => {
  if (validators.includes(accountId)) {
    return true;
  }
  const staking = await api.query.staking.nominators(accountId);
  return !staking.isEmpty;
};

const fetchAccountBalance = async (accountId, api) => {
  const balance = await api.derive.balances.all(accountId);
  return balance;
};

/**
 * Creates an account object from attributes.
 *
 * @param {String}  id         ID of the account
 * @param {String}  identity   Identity on the blockchain of the account
 * @param {String}  balances   Current balances of the account
 * @param {Boolean} isStaking  True if the account is staking
 */
const buildAccount = (id, identity, balances, isStaking) => {
  return { id, identity, balances, isStaking };
};

/**
 * Applies a zip function to multiple lists containing related data and then
 * groups related entries using a builder function.
 *
 * @param {String}    name      Name of the attribute to store the builder result
 * @param {Function}  builder   Function using to build the initial state object
 */
const prepareState = (name, builder) => itemsList => {
  return zip(...itemsList)
    .map(items => builder(...items))
    .map(result => ({ [name]: result }));
};

/**
 * Specific version of prepareState to initizalize the state with an account
 * object.
 */
const makeState = prepareState('account', buildAccount);

/**
 * Builds an upsert query: Try to INSERT an entry on the database, if a
 * conflict with the "account_id" key occurs, then update the entry instead of
 * create a new one. Stores the built query in the state object.
 *
 * @param {Object} state       State object, containing account info
 * @param {Number} block       Block number attached to the entry
 * @param {Number} timestamp   Timestamp attached to the entry
 */
const makeQuery = (state, block, timestamp) => {
  const { id, identity, balances, isStaking } = state.account;
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const identityDisplay = identity.display ? identity.display.toString() : ``;
  const identityDisplayParent = identity.displayParent ? identity.displayParent.toString() : ``;
  const JSONIdentity = identity.display ? JSON.stringify(identity) : ``;
  const JSONbalances = JSON.stringify(balances);
  const nonce = balances.accountNonce.toString();
  const query = `                                                                                                                                                                                                                      \
    INSERT INTO   account (account_id, identity, identity_display, identity_display_parent, balances, available_balance, free_balance, locked_balance, nonce, timestamp, block_height, is_staking)                                     \
    VALUES        ('${id}', '${JSONIdentity}', '${identityDisplay}', '${identityDisplayParent}', '${JSONbalances}', '${availableBalance}', '${freeBalance}', '${lockedBalance}', '${nonce}', '${timestamp}', '${block}', ${isStaking || false}) \
    ON CONFLICT   (account_id)                                                                                                                                                                                                         \
    DO UPDATE                                                                                                                                                                                                                          \
    SET           identity = EXCLUDED.identity,                                                                                                                                                                                        \
                  balances = EXCLUDED.balances,                                                                                                                                                                                        \
                  available_balance = EXCLUDED.available_balance,                                                                                                                                                                      \
                  free_balance = EXCLUDED.free_balance,                                                                                                                                                                                \
                  timestamp = EXCLUDED.timestamp,                                                                                                                                                                                      \
                  is_staking = EXCLUDED.is_staking,                                                                                                                                                                                    \
                  block_height = EXCLUDED.block_height;                                                                                                                                                                                \
  `;

  return { ...state, query };
};

/**
 * Uses a provided connection pool to send a query to Postgres. Stores a promise
 * wrapping the result of the execution in the state object.
 *
 * @param {Object}  state   State object, containing the query
 * @param {Object}  pool    Postgres connection pool
 */
const execQuery = (state, pool) => {
  const queryResult = pool
    .query(state.query)
    .catch(err =>
      logger.error(loggerOptions, `Error updating account ${state.account.id}: ${err}`),
    );

  return { ...state, queryResult };
};

/**
 * Runs every iteration. Fetchs some data from the blockchain, constructs a
 * SQL query an executes the query.
 *
 * @param {*} api   Polkadot API object
 * @param {*} pool  Postgres connection pool
 */
const exec = async (api, pool) => {
  logger.info(loggerOptions, `Running active accounts crawler...`);

  const timestamp = Date.now();
  const block = await fetchBlockNumber(api);
  const validators = null; //await fetchValidators(api);

  const accountIds = await fetchAccountIds(api);

  const accountsIdentity = await Promise.all(
    accountIds.map(id => fetchAccountIdentity(id, api)),
  );
  const accountsBalances = await Promise.all(
    accountIds.map(id => fetchAccountBalance(id, api)),
  );
  const accountsStaking = false; /*await Promise.all(
    accountIds.map(id => fetchAccountStaking(id, api, validators)),
  );*/

  await Promise.all(
    makeState([accountIds, accountsIdentity, accountsBalances, accountsStaking])
      .map(state => makeQuery(state, block, timestamp))
      .map(state => execQuery(state, pool))
      .map(state => state.queryResult), // Pick the promise to await
  );

  logger.info(loggerOptions, `Processed ${accountIds.length} active accounts`);
};

/**
 * Calls run function and then sets a timer to run the function again after
 * some time.
 *
 * @param {*} api     Polkadot API object
 * @param {*} pool    Postgres connection pool
 * @param {*} config  Crawler configuration
 */
const start = async (api, pool, config) => {
  const pollingTime = config.pollingTime || DEFAULT_POLLING_TIME_MS;

  (async function run() {
    await exec(api, pool).catch(err =>
      logger.error(loggerOptions, `Error running crawler: ${err}`),
    );

    setTimeout(() => run(), pollingTime);
  })();
};

module.exports = { start };
