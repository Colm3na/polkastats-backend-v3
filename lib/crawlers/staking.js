const {BigNumber} = require('bignumber.js');

// @ts-check

module.exports = {
  start: async function (api, pool, _config) {
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting staking crawler...\x1b[0m`);

    let currentDBSessionIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT session_index FROM validator_staking ORDER BY session_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currentDBSessionIndex = parseInt(res.rows[0]["session_index"]);
      console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mLast session index stored in DB is #${currentDBSessionIndex}\x1b[0m`);
    } else {
      console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mFirst execution, no session index found in DB!\x1b[0m`);

      const sessionInfo = await api.derive.session.info();
      const currentEraIndex = sessionInfo.activeEra.toNumber();
      const currentSessionIndex = sessionInfo.currentIndex.toNumber();
      currentDBSessionIndex = currentSessionIndex;

      const block = await api.rpc.chain.getBlock();
      const blockNumber = block.block.header.number.toNumber();
      await module.exports.storeStakingInfo(api, pool, blockNumber, sessionInfo, currentEraIndex);
    }
    
    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads(async (header) => {

      const blockNumber = header.number.toNumber();
      const parentHash = header.parentHash.toString();
      // console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mNew block #${blockNumber}\x1b[0m`);

      const sessionInfo = await api.derive.session.info();
      const currentEraIndex = sessionInfo.activeEra.toNumber();
      const currentSessionIndex = sessionInfo.currentIndex.toNumber();
  
      if (currentSessionIndex > currentDBSessionIndex) {
        currentDBSessionIndex = currentSessionIndex;
        await module.exports.storeStakingInfo(api, pool, blockNumber, parentHash, sessionInfo, currentEraIndex);
      }
    });
  },
  storeStakingInfo: async function (api, pool, blockNumber, parentHash, sessionInfo, currentEraIndex) {

    const currentIndex = sessionInfo.currentIndex.toNumber();

    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mStoring validators staking info for session #${currentIndex} (block #${blockNumber})\x1b[0m`);

    //
    // Get all stash addresses, active validators, imOnline data, current elected and current era points earned
    //
    const [allStashAddresses, validatorAddresses, imOnline, stakingOverview, erasRewardPoints] = await Promise.all([
      api.derive.staking.stashes(),
      api.query.session.validators(),
      api.derive.imOnline.receivedHeartbeats(),
      api.derive.staking.overview(),
      api.query.staking.erasRewardPoints(currentEraIndex)
    ]);

    // Fetch intention validator addresses for current session.
    const intentionAddresses = allStashAddresses.filter(address => !validatorAddresses.includes(address));

    //
    // Map validator authorityId to staking info object
    //
    const validatorStaking = await Promise.all(
      validatorAddresses.map(authorityId => api.derive.staking.account(authorityId))
    );
  
    //
    // Add hex representation of sessionId[] and nextSessionId[]
    //
    validatorStaking.forEach(validator => {
      validator.sessionIdHex = validator.sessionIds.length !== 0 ? validator.sessionIds.toHex() : ``;
      validator.nextSessionIdHex = validator.nextSessionIds.length !== 0 ? validator.nextSessionIds.toHex() : ``;
    })

    //
    // Add imOnline property to validator object
    //
    validatorStaking.forEach(function (validator) {
      if (imOnline[validator.accountId]) {
        validator.imOnline = imOnline[validator.accountId];
      }
    }, imOnline);

    //
    // Add current elected property
    //
    const { nextElected } = JSON.parse(JSON.stringify(stakingOverview));
    validatorStaking.forEach(function (validator) {
      if (nextElected.includes(validator.accountId.toString())) {
        validator.currentElected = true;
      } else {
        validator.currentElected = false;
      }
    });
  
    //
    // Add earned era points to validator object
    //
    for(let i = 0; i < validatorStaking.length; i++) {
      let validator = validatorStaking[i];
      if (Object.keys(erasRewardPoints.individual).includes(erasRewardPoints)) {
        validator.erasRewardPoints = erasRewardPoints.individual[validator.accountId];
      }
    }
  
    if (validatorStaking) {
      console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mInserting staking data in DB\x1b[0m`);
      let sqlInsert = `INSERT INTO validator_staking (block_number, session_index, json, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(validatorStaking)}', extract(epoch from now()));`;
      try {
        await pool.query(sqlInsert);
      } catch (error) {
        // console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[31mSQL: ${sqlInsert}\x1b[0m`);
        console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
      }
    }

    //
    // Populate validator graph data tables
    //
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mPopulating validator_bonded, validator_selfbonded, validator_num_nominators and validator_active tables\x1b[0m`);
    validatorStaking.forEach(async validator => {

      // populate validator_bonded table
      let sql = `INSERT INTO validator_bonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${BigNumber(validator.exposure.total).toString(10)}', extract(epoch from now()));`;
      await pool.query(sql);
      
      // populate validator_selfbonded table
      sql = `INSERT INTO validator_selfbonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${BigNumber(validator.exposure.own).toString(10)}', extract(epoch from now()));`;
      await pool.query(sql);

      // populate validator_num_nominators table
      sql = `INSERT INTO validator_num_nominators (block_number, session_index, account_id, nominators, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${validator.exposure.others.length}', extract(epoch from now()));`;
      await pool.query(sql);

      // populate validator_active table
      sql = `INSERT INTO validator_active (block_number, session_index, account_id, active, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', 'true', extract(epoch from now()));`;
      await pool.query(sql);

      // populate validator_produced_blocks table (for last session)
      const producedBlocks = await api.query.imOnline.authoredBlocks.at(parentHash, currentIndex -1, validator.accountId);
      sql = `INSERT INTO validator_produced_blocks (block_number, session_index, account_id, produced_blocks, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${producedBlocks}', extract(epoch from now()));`;
      await pool.query(sql);
      
    })
    
    //
    // Fetch intention validators
    //
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mStoring intentions staking info for session #${currentIndex} (block #${blockNumber}\x1b[0m`);
  
    //
    // Map validator authorityId to staking info object
    //
    const intentionStaking = await Promise.all(
      intentionAddresses.map(authorityId => api.derive.staking.account(authorityId))
    );
  
    //
    // Add hex representation of sessionId[] and nextSessionId[]
    //
    for(let i = 0; i < intentionStaking.length; i++) {
      let intention = intentionStaking[i];
      if (intention.sessionIds.length > 0) {
        intention.sessionIdHex = intention.sessionIds.toHex();
      }
      if (intention.nextSessionIds.length > 0) {
        intention.nextSessionIdHex = intention.nextSessionIds.toHex();
      }
    }

    //
    // Populate intention_staking table
    //
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mPopulating intention_staking table\x1b[0m`);

    if (intentionStaking) {
      console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mInserting staking data in DB\x1b[0m`);
      let sqlInsert = `INSERT INTO intention_staking (block_number, session_index, json, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(intentionStaking)}', extract(epoch from now()));`;
      try {
        await pool.query(sqlInsert);
        // console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mResponse from Database is ${JSON.stringify(res)}]`)
      } catch (error) {
        console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
      }
    }

    //
    // Populate intention_bonded table
    //
    console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[32mPopulating intention_bonded table\x1b[0m`);
    intentionStaking.forEach(async intention => {
      const sql = `INSERT INTO intention_bonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${intention.accountId.toString()}', '${BigNumber(intention.stakingLedger.total).toString(10)}', extract(epoch from now()));`;
      await pool.query(sql);
    })

  }
}
    