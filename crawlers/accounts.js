//
// PolkaStats backend v3
//
// This crawler get information about accounts
//
// Usage: node accounts.js
//
//

// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Postgres lib
const { Pool } = require('pg');

// Import config params
const {
  wsProviderUrl,
  postgresConnParams
} = require('../backend.config');

let isSynced = false;

async function main () {  
  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API
  const api = await ApiPromise.create({ provider });

  // Wait for API
  await api.isReady;

  // Wait for node is synced
  let node;
  try {
    node = await api.rpc.system.health();
  } catch {
    provider.disconnect();
    console.log(`[PolkaStats backend v3] - Accounts - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
    setTimeout(main, 10000);
  }

  if (node.isSyncing.eq(false)) {

    // Node is synced!
    isSynced = true;
    console.log(`[PolkaStats backend v3] - Accounts - \x1b[33mNode is synced! Starting crawler...\x1b[0m`);
    
    // Database connection
    const pool = new Pool(postgresConnParams);
    await pool.connect();

    // Fetch active accounts
    const accounts = await api.derive.accounts.indexes();

    let accountsInfo = [];

    for (var key in accounts ) {
      let accountId = key;
      let accountIndex = accounts[key]
      let accountInfo = await api.derive.accounts.info(accountId);
      let identity = accountInfo.identity.display ? JSON.stringify(accountInfo.identity) : '';
      let nickname = accountInfo.nickname ? accountInfo.nickname : '';
      let balances = await api.derive.balances.all(accountId);
      accountsInfo[accountId] = {
        accountId,
        accountIndex,
        identity,
        nickname,
        balances
      }
      console.log(`Processing account ${accountId}`);
      // console.log(JSON.stringify(accountsInfo[accountId], null, 2));
    }

    // Log active accounts
    // console.log(JSON.stringify(accountsInfo, null, 2));

    // Main loop
    for (var key in accountsInfo ) {
      if (accountsInfo.hasOwnProperty(key)) {
        // console.log(key + " -> " + accounts[key]);
        let sql = `SELECT account_id FROM account WHERE account_id = '${key}'`;
        let res = await pool.query(sql);
        const sqlBlockHeight = `SELECT block_number FROM block ORDER BY timestamp desc LIMIT 1`;
        const resBlockHeight = await pool.query(sqlBlockHeight);
        if (res.rows.length > 0) {
          const timestamp = new Date().getTime();
          sql = `UPDATE account SET account_index = '${accountsInfo[key].accountIndex}', nickname = '${accountsInfo[key].nickname}', identity = '${accountsInfo[key].identity}', balances = '${JSON.stringify(accountsInfo[key].balances)}', timestamp = '${timestamp}', block_height = '${resBlockHeight.rows[0].block_number}' WHERE account_id = '${key}'`;

          try {
            await pool.query(sql);
            console.log(`[PolkaStats backend v3] - Accounts - \x1b[31mUpdating account: accountId: ${key} accountIndex: ${accountsInfo[key].accountIndex} nickname: ${accountsInfo[key].nickname} identity: ${accountsInfo[key].identity} balances: ${JSON.stringify(accountsInfo[key].balances)}\x1b[0m`);
          } catch (error) {
            console.log(`[PolkaStats backend v3] - Accounts - \x1b[31mError updating account ${key}\x1b[0m`);
          }
        } else {
          const timestamp = new Date().getTime();
          sql = `INSERT INTO account (account_id, account_index, nickname, identity, balances, timestamp, block_height) VALUES ('${key}', '${accountsInfo[key].accountIndex}', '${accountsInfo[key].nickname}', '${accountsInfo[key].idenity}', '${JSON.stringify(accountsInfo[key].balances)}', '${timestamp}', '${resBlockHeight.rows[0].block_number}');`;
          try {
            await pool.query(sql);
            console.log(`[PolkaStats backend v3] - Accounts - \x1b[31mNew account: accountId: ${key} accountIndex: ${accountsInfo[key].accountIndex} nickname: ${accountsInfo[key].nickname} identity: ${accountsInfo[key].identity} balances: ${JSON.stringify(accountsInfo[key].balances)}\x1b[0m`);
          } catch (error) {
            console.log(`[PolkaStats backend v3] - Accounts - \x1b[31mError new account ${key}\x1b[0m`);
          }
        } 
      }
    }

    pool.end();
    }

    console.log(`[PolkaStats backend v3] - Accounts - \x1b[31mNode is not synced! Waiting 10s...\x1b[0m`);
    setTimeout(function() {
      if (!isSynced) {
        provider.disconnect();
        main();
      }
    }, 10000);
  }

main().catch(console.error).finally(() => process.exit());