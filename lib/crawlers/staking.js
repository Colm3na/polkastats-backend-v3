// @ts-check
const { BigNumber } = require('bignumber.js');
const { getDisplayName } = require('../utils.js');
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
    const sqlSelect = `SELECT session_index FROM validator ORDER BY session_index DESC LIMIT 1`;
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
    const [validatorAddresses, imOnline, stakingOverview] = await Promise.all([
      api.query.session.validators(),
      api.derive.imOnline.receivedHeartbeats(),
      api.derive.staking.overview()
    ]);

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
      validator.displayName = getDisplayName(identity);
    }

    //
    // Stakers
    //
    for(let i = 0; i < validatorStaking.length; i++) {
      let validator = validatorStaking[i];
      let stakers = [];
      for(let j = 0; j < validator.exposure.others.length; j++) {
        let nomination = validator.exposure.others[j];
        const { identity } = await api.derive.accounts.info(nomination.who);
        const displayName = getDisplayName(identity);
        stakers.push({
          who: nomination.who,
          displayName,
          value: nomination.value,
          rank: 0
        })
      }
      stakers.sort((a, b) => {
        const A = new BigNumber(a.value);
        const B = new BigNumber(b.value);
        return A.lt(B) ? 1 : -1;
      });
      let rank = 1;
      for(let i = 0; i < stakers.length; i++) {
        const staker = stakers[i];
        staker.rank = rank;
        rank++;
      }
      validator.stakers = stakers;
    }
    
    //
    // Populate nominator table
    //
    let nominatorStaking = [];
    for (let i = 0; i < validatorStaking.length; i++) {
      let validator = validatorStaking[i];
      if (validator.exposure.others.length > 0) {
        for (let j = 0; j < validator.exposure.others.length; j++) {
          let nominator = validator.exposure.others[j];
          if (
            nominatorStaking.find(nom => nom.accountId === nominator.who)
          ) {
            let nominatorTmp = nominatorStaking.filter(nom => {
              return nom.accountId === nominator.who;
            });
            const totalStakedBN = new BigNumber(nominator.value.toString());
            nominatorTmp[0].totalStakedBN = nominatorTmp[0].totalStakedBN.plus(
              totalStakedBN
            );
            nominatorTmp[0].nominations++;
            nominatorTmp[0].targets.push({
              validator: validator.accountId,
              displayName: validator.displayName,
              amount: nominator.value
            });
          } else {
            const totalStakedBN = new BigNumber(nominator.value.toString());
            const { identity } = await api.derive.accounts.info(nominator.who);
            const balances = await api.derive.balances.all(nominator.who);
            const availableBalance = balances.availableBalance.toString();
            const freeBalance = balances.freeBalance.toString();
            const lockedBalance = balances.lockedBalance.toString();
            const nonce = balances.accountNonce.toString();
            const displayName = getDisplayName(identity);

            const bonded = await api.query.staking.bonded(nominator.who)

            nominatorStaking.push({
              rank: 0,
              accountId: nominator.who,
              stashId: nominator.who,
              controllerId: bonded.toString(),
              identity,
              displayName,
              totalStakedBN,
              totalStaked: totalStakedBN.toString(),
              nominations: 1,
              balances,
              availableBalance,
              freeBalance,
              lockedBalance,
              nonce,
              targets: [
                {
                  validator: validator.accountId,
                  displayName: validator.displayName,
                  amount: nominator.value
                }
              ]
            });
          }
        }
      }
    }
    nominatorStaking.sort((a, b) => {
      const A = new BigNumber(a.totalStaked);
      const B = new BigNumber(b.totalStaked);
      return A.lt(B) ? 1 : -1;
    });
    let rank = 1;
    for(let i = 0; i < nominatorStaking.length; i++) {
      const nominator = nominatorStaking[i];
      nominator.rank = rank;

      const sql = 
        `INSERT INTO nominator (
          block_height,
          session_index,
          account_id,
          controller_id,
          stash_id,
          rank,
          identity,
          display_name,
          balances,
          available_balance,
          free_balance,
          locked_balance,
          nonce,
          targets,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${currentIndex}',
          '${nominator.accountId}',
          '${nominator.controllerId}',
          '${nominator.stashId}',
          '${nominator.rank}',
          '${JSON.stringify(nominator.identity)}',
          '${nominator.displayName}',
          '${JSON.stringify(nominator.balances)}',
          '${nominator.availableBalance}',
          '${nominator.freeBalance}',
          '${nominator.lockedBalance}',
          '${nominator.nonce}',
          '${JSON.stringify(nominator.targets)}',
          '${Date.now()}'
        )
        ON CONFLICT ON CONSTRAINT nominator_pkey 
        DO NOTHING
        ;`;
      try {
        await pool.query(sql);
        logger.info(loggerOptions, `Added nominator ${nominator.accountId}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding nominator ${nominator.accountId}: ${error}, sql: ${sql}`);
      }
      rank++;
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
    rank = 1;
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
          stakers,
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
          produced_blocks,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${currentIndex}',
          '${validator.accountId}',
          '${validator.controllerId}',
          '${validator.stashId}',
          '${validator.rank}',
          '${JSON.stringify(validator.stakers)}',
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
          '${JSON.stringify(validator.imOnline)}',
          '${validator.currentElected}',
          '${validator.nextElected}',
          0,
          '${Date.now()}'
        )`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting data in validator table: ${JSON.stringify(error)}`);
      }
    }
    
    //
    // Fetch intention validators
    //
    logger.info(loggerOptions, `Storing intentions staking info for session #${currentIndex} (block #${blockNumber}`);
  
    //
    // Get intention staking info
    //
    const { info } = await api.derive.staking.waitingInfo();
    const intentionStaking = info;
  
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
    // Add intention stakers
    //
    const nominators = await api.query.staking.nominators.entries();
    const nominations = nominators.map(([key, nominations]) => {
      const nominator = key.toHuman()[0];
      const targets = nominations.toHuman().targets;
      return {
        nominator,
        targets
      }
    });

    for(let i = 0; i < intentionStaking.length; i++) {
      let intention = intentionStaking[i];
      intention.stakers = nominations
        .filter(nomination => nomination.targets.some(target => target === intention.accountId.toString()))
        .map(nomination => nomination.nominator);
    }

    //
    // Add identity
    //
    for(let i = 0; i < intentionStaking.length; i++) {
      let intention = intentionStaking[i];
      const { identity } = await api.derive.accounts.info(intention.accountId);
      intention.identity = identity;
      intention.displayName = getDisplayName(identity);
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
          stakers,
          identity,
          display_name,
          nominators,
          reward_destination,
          staking_ledger,
          staking_ledger_total,
          validator_prefs,
          commission,
          next_session_ids,
          next_session_id_hex,
          next_elected,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${currentIndex}',
          '${intention.accountId}',
          '${intention.controllerId}',
          '${intention.stashId}',
          '${intention.rank}',
          '${JSON.stringify(intention.stakers)}',
          '${JSON.stringify(intention.identity)}',
          '${intention.displayName}',
          '${JSON.stringify(intention.nominators)}',
          '${intention.rewardDestination}',
          '${intention.stakingLedger}',
          '${intention.stakingLedger.total}',
          '${JSON.stringify(intention.validatorPrefs)}',
          '${intention.validatorPrefs.commission}',
          '${intention.nextSessionIds}',
          '${intention.nextSessionIdHex}',
          '${intention.nextElected}',
          '${Date.now()}'
        )`;
      try {
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error inserting data in validator table: ${JSON.stringify(error)}`);
      }
    }
  }
}
    