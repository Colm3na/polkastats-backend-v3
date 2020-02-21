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


async function main () {  
  // Database connection
  const pool = new Pool(postgresConnParams);
  await pool.connect();
  
  // Initialise the provider to connect to the local polkadot node
  const provider = new WsProvider(wsProviderUrl);

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });
  
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
    // console.log(`Processing account ${accountId}`);
    // console.log(JSON.stringify(accountsInfo[accountId], null, 2));
  }

  // Log active accounts
  // console.log(JSON.stringify(accountsInfo, null, 2));

  // Main loop
   for (var key in accountsInfo ) {
    if (accountsInfo.hasOwnProperty(key)) {
      // console.log(key + " -> " + accounts[key]);
      let sql = `SELECT accountId FROM account WHERE accountId = '${key}'`;
      let res = await pool.query(sql);
      if (res.rows.length > 0) {
        // console.log(`Updating account: accountId: ${key} accountIndex: ${accountsInfo[key].accountIndex} nickname: ${accountsInfo[key].nickname} identity: ${accountsInfo[key].identity} balances: ${JSON.stringify(accountsInfo[key].balances)}`);
        sql = `UPDATE account SET accountIndex = '${accountsInfo[key].accountIndex}', nickname = '${accountsInfo[key].nickname}', identity = '${accountsInfo[key].identity}', balances = '${JSON.stringify(accountsInfo[key].balances)}' WHERE accountId = '${key}'`;
        await pool.query(sql);
      } else {
        // console.log(`New account: accountId: ${key} accountIndex: ${accountsInfo[key].accountIndex} nickname: ${accountsInfo[key].nickname} identity: ${accountsInfo[key].identity} balances: ${JSON.stringify(accountsInfo[key].balances)}`);
        sql = `INSERT INTO account (accountId, accountIndex, nickname, identity, balances) VALUES ('${key}', '${accountsInfo[key].accountIndex}', '${accountsInfo[key].nickname}', '${accountsInfo[key].idenity}', '${JSON.stringify(accountsInfo[key].balances)}');`;
        await pool.query(sql);
      } 
    }
  }

  pool.end();
}

main().catch(console.error).finally(() => process.exit());