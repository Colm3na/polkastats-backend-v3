// @ts-check
module.exports = {
  start: async function (api, pool, config) {
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting active accounts crawler...\x1b[0m`);

    // Fetch active accounts
    const accountKeys = await api.query.system.account.keys()
    const accounts = accountKeys.map(key => key.args[0].toHuman());

    console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[32mProcessing ${accounts.length} active accounts\x1b[0m`);

    await accounts.forEach(async accountId => {

      // console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[32mProcessing account ${accountId}\x1b[0m`);
      const accountInfo = await api.derive.accounts.info(accountId);
      const identity = accountInfo.identity.display ? JSON.stringify(accountInfo.identity) : ``;
      const balances = await api.derive.balances.all(accountId);
      const block = await api.rpc.chain.getBlock();
      const blockNumber = block.block.header.number.toNumber();
      
      let sql = `SELECT account_id FROM account WHERE account_id = '${accountId}'`;
      let res = await pool.query(sql);

      if (res.rows.length > 0) {
        const timestamp = new Date().getTime();
        sql = `UPDATE account SET identity = '${identity}', balances = '${JSON.stringify(balances)}', timestamp = '${timestamp}', block_height = '${blockNumber}' WHERE account_id = '${accountId}'`;
        try {
          // console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[32mUpdating account ${accountId}\x1b[0m`);
          await pool.query(sql);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError updating account ${accountId}\x1b[0m`);
          console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError: ${error}\x1b[0m`);
        }
      } else {
        const timestamp = new Date().getTime();
        sql = `INSERT INTO account (account_id, identity, balances, timestamp, block_height) VALUES ('${accountId}', '${identity}', '${JSON.stringify(balances)}', '${timestamp}', '${blockNumber}');`;
        try {
          // console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[32mAdding account ${accountId}\x1b[0m`);
          await pool.query(sql);
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError adding new account ${accountId}\x1b[0m`);
          console.log(`[PolkaStats backend v3] - Active Accounts - \x1b[31mError: ${error}\x1b[0m`);
        }
      }
    });

    setTimeout(
      () => module.exports.start(api, pool, config),
      config.pollingTime,
    );
  }
}