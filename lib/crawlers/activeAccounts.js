module.exports = {
  activeAccounts: async function (api, pool, config) {
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
      console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[33mProcessing account ${accountId}\x1b[0m`);
    }

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
            console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[33mUpdating account ${accountsInfo[key].accountIndex} [${key}]\x1b[0m`);
            await pool.query(sql);
          } catch (error) {
            console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError updating account ${key}\x1b[0m`);
          }
        } else {
          const timestamp = new Date().getTime();
          sql = `INSERT INTO account (account_id, account_index, nickname, identity, balances, timestamp, block_height) VALUES ('${key}', '${accountsInfo[key].accountIndex}', '${accountsInfo[key].nickname}', '${accountsInfo[key].idenity}', '${JSON.stringify(accountsInfo[key].balances)}', '${timestamp}', '${resBlockHeight.rows[0].block_number}');`;
          try {
            console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[33mAdding account ${accountsInfo[key].accountIndex} [${key}]\x1b[0m`);
            await pool.query(sql);
          } catch (error) {
            console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError adding new account ${key}\x1b[0m`);
          }
        } 
      }
    }
    setTimeout(module.exports.activeAccounts(api, pool, config), config.ACTIVE_ACCOUNTS_POLLING_TIME);
  }
}