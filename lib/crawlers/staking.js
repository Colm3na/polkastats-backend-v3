// @ts-check
const { BigNumber } = require('bignumber.js');
const pino = require('pino');
const logger = pino();

const loggerOptions = {
  crawler: `chain`
};

module.exports = {
  start: async function (api, pool, _config) {
    logger.info(loggerOptions, `Starting staking crawler...`);

    let currentDBSessionIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT session_index FROM validator_staking ORDER BY session_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currentDBSessionIndex = parseInt(res.rows[0]["session_index"]);
      logger.info(loggerOptions, `Last session index stored in DB is #${currentDBSessionIndex}`);
    } else {
      logger.info(loggerOptions, `First execution, no session index found in DB!`);

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

      const sessionInfo = await api.derive.session.info();
      const currentEraIndex = sessionInfo.activeEra.toNumber();
      const currentSessionIndex = sessionInfo.currentIndex.toNumber();
  
      if (currentSessionIndex > currentDBSessionIndex) {
        currentDBSessionIndex = currentSessionIndex;
        await module.exports.storeStakingInfo(api, pool, blockNumber, sessionInfo, currentEraIndex);
      }
    });
  },
  storeStakingInfo: async function (api, pool, blockNumber, sessionInfo, currentEraIndex) {

    const currentIndex = sessionInfo.currentIndex.toNumber();

    logger.info(loggerOptions, `Storing validators staking info for session #${currentIndex} (block #${blockNumber})`);

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
    // Add identity
    //
    for(let i = 0; i < validatorStaking.length; i++) {
      let validator = validatorStaking[i];
      const { identity } = await api.derive.accounts.info(validator.accountId);
      validator.identity = identity;
      if (
        identity.displayParent &&
        identity.displayParent !== `` &&
        identity.display &&
        identity.display !== ``
      ) {
        validator.displayName = `${identity.displayParent} / ${identity.display}`;
      } else {
        validator.displayName = identity.display || ``;
      }
    }

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
      logger.info(loggerOptions, `Inserting staking data in DB`);
      let sqlInsert = `INSERT INTO validator_staking (block_number, session_index, json, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(validatorStaking)}', '${Date.now()}');`;
      try {
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting staking data in DB: ${JSON.stringify(error)}`);
      }
    }

    //
    // TODO: Add next elected
    //
    validatorStaking.forEach(function (validator) {
      validator.nextElected = true;
    });

    //
    // Sort by stake / add rank
    //
    validatorStaking.sort((a, b) => {
      const A = new BigNumber(a.exposure.total);
      const B = new BigNumber(b.exposure.total);
      return A.lt(B) ? 1 : -1;
    });
    let rank = 1;
    for(let i = 0; i < validatorStaking.length; i++) {
      const intention = validatorStaking[i];
      intention.rank = rank;
      rank++;
    }

    //
    // Populate validator table
    //
    for(let i = 0; i < validatorStaking.length; i++) {
      const validator = validatorStaking[i];
      const sql = `
        INSERT INTO validator (
          block_height,
          session_index,
          account_id,
          controller_id,
          stash_id,
          rank,
          identity,
          display_name,
          exposure,
          exposure_total,
          exposure_own,
          exposure_others,
          nominators,
          reward_destination,
          staking_ledger,
          validator_prefs,
          commission,
          session_ids,
          next_session_ids,
          session_id_hex,
          next_session_id_hex,
          redeemable,
          im_online,
          current_elected,
          next_elected,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${currentIndex}',
          '${validator.accountId}',
          '${validator.controllerId}',
          '${validator.stashId}',
          '${validator.rank}',
          '${JSON.stringify(validator.identity)}',
          '${validator.displayName}',
          '${JSON.stringify(validator.exposure)}',
          '${validator.exposure.total}',
          '${validator.exposure.own}',
          '${validator.exposure.others}',
          '${JSON.stringify(validator.nominators)}',
          '${validator.rewardDestination}',
          '${validator.stakingLedger}',
          '${JSON.stringify(validator.validatorPrefs)}',
          '${validator.validatorPrefs.commission}',
          '${validator.sessionIds}',
          '${validator.nextSessionIds}',
          '${validator.sessionIdHex}',
          '${validator.nextSessionIdHex}',
          '${validator.redeemable}',
          '${validator.imOnline}',
          '${validator.currentElected}',
          '${validator.nextElected}',
          '${Date.now()}'
        )`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting data in validator table: ${JSON.stringify(error)}`);
      }
    }

    //
    // Populate validator graph data tables
    //
    logger.info(loggerOptions, `Populating validator_bonded, validator_selfbonded, validator_num_nominators and validator_active tables`);
    validatorStaking.forEach(async validator => {

      // PoA validators have no exposure at all
      const totalBonded = validator.exposure ? new BigNumber(validator.exposure.total).toString(10) : 0
      const selfBonded = validator.exposure ? new BigNumber(validator.exposure.own).toString(10) : 0
      const numNominators = validator.exposure ? validator.exposure.others.length : 0

      // populate validator_bonded table
      let sql = `INSERT INTO validator_bonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${totalBonded}', '${Date.now()}');`;
      await pool.query(sql);
      
      // populate validator_selfbonded table
      sql = `INSERT INTO validator_selfbonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${selfBonded}', '${Date.now()}');`;
      await pool.query(sql);

      // populate validator_num_nominators table
      sql = `INSERT INTO validator_num_nominators (block_number, session_index, account_id, nominators, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', '${numNominators}', '${Date.now()}');`;
      await pool.query(sql);

      // populate validator_active table
      sql = `INSERT INTO validator_active (block_number, session_index, account_id, active, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${validator.accountId.toString()}', 'true', '${Date.now()}');`;
      await pool.query(sql);
      
    })
    
    //
    // Fetch intention validators
    //
    logger.info(loggerOptions, `Storing intentions staking info for session #${currentIndex} (block #${blockNumber}`);
  
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
    // Add identity
    //
    for(let i = 0; i < intentionStaking.length; i++) {
      let intention = intentionStaking[i];
      const { identity } = await api.derive.accounts.info(intention.accountId);
      intention.identity = identity;
      if (
        identity.displayParent &&
        identity.displayParent !== `` &&
        identity.display &&
        identity.display !== ``
      ) {
        intention.displayName = `${identity.displayParent} / ${identity.display}`;
      } else {
        intention.displayName = identity.display || ``;
      }
    }

    //
    // TODO: Add next elected
    //
    intentionStaking.forEach(function (intention) {
      intention.nextElected = true;
    });

    //
    // Sort by stake / add rank
    //
    intentionStaking.sort((a, b) => {
      const A = new BigNumber(a.stakingLedger.total);
      const B = new BigNumber(b.stakingLedger.total);
      return A.lt(B) ? 1 : -1;
    });
    rank = 1;
    for(let i = 0; i < intentionStaking.length; i++) {
      const intention = intentionStaking[i];
      intention.rank = rank;
      rank++;
    }

    //
    // Populate intention table
    //
    for(let i = 0; i < intentionStaking.length; i++) {
      const intention = intentionStaking[i];
      const sql = `
        INSERT INTO intention (
          block_height,
          session_index,
          account_id,
          controller_id,
          stash_id,
          rank,
          identity,
          display_name,
          exposure,
          exposure_total,
          exposure_own,
          exposure_others,
          nominators,
          reward_destination,
          staking_ledger,
          validator_prefs,
          commission,
          next_session_ids,
          next_session_id_hex,
          redeemable,
          next_elected,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${currentIndex}',
          '${intention.accountId}',
          '${intention.controllerId}',
          '${intention.stashId}',
          '${intention.rank}',
          '${JSON.stringify(intention.identity)}',
          '${intention.displayName}',
          '${JSON.stringify(intention.exposure)}',
          '${intention.exposure.total}',
          '${intention.exposure.own}',
          '${intention.exposure.others}',
          '${JSON.stringify(intention.nominators)}',
          '${intention.rewardDestination}',
          '${intention.stakingLedger}',
          '${JSON.stringify(intention.validatorPrefs)}',
          '${intention.validatorPrefs.commission}',
          '${intention.nextSessionIds}',
          '${intention.nextSessionIdHex}',
          '${intention.redeemable}',
          '${intention.nextElected}',
          '${Date.now()}'
        )`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting data in validator table: ${JSON.stringify(error)}`);
      }
    }

    //
    // Populate intention_staking table
    //
    logger.info(loggerOptions, `Populating intention_staking table`);

    if (intentionStaking) {
      logger.info(loggerOptions, `Inserting intention staking data in DB`);
      let sqlInsert = `INSERT INTO intention_staking (block_number, session_index, json, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(intentionStaking)}', '${Date.now()}');`;
      try {
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting intention staking data in DB: ${JSON.stringify(error)}`);
      }
    }

    //
    // Populate intention_bonded table
    //
    logger.info(loggerOptions, `Populating intention_bonded table`);
    intentionStaking.forEach(async intention => {
      const sql = `INSERT INTO intention_bonded (block_number, session_index, account_id, amount, timestamp) VALUES ('${blockNumber}', '${currentIndex}', '${intention.accountId.toString()}', '${new BigNumber(intention.stakingLedger.total).toString(10)}', '${Date.now()}');`;
      await pool.query(sql);
    })

  }
}
    