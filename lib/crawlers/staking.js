// @ts-check
const { BigNumber } = require('bignumber.js');
const { getDisplayName } = require('../utils.js');
const pino = require('pino');
const logger = pino();
const format = require('pg-format');

const loggerOptions = {
  crawler: `staking`
};

module.exports = {
  start: async function (api, pool, _config) {
    logger.info(loggerOptions, `Starting staking crawler...`);

    let currentKnownSessionIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT session_index FROM validator ORDER BY session_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currentKnownSessionIndex = parseInt(res.rows[0]["session_index"]);
      logger.info(loggerOptions, `Last session index stored in DB is #${currentKnownSessionIndex}`);
    } else {
      logger.info(loggerOptions, `First execution, no session index found in DB!`);

      const sessionInfo = await api.derive.session.info();
      const currentSessionIndex = sessionInfo.currentIndex.toNumber();
      currentKnownSessionIndex = currentSessionIndex;

      const block = await api.rpc.chain.getBlock();
      const blockNumber = block.block.header.number.toNumber();
      await module.exports.storeSessionStakingInfo(api, pool, blockNumber, sessionInfo);
    }
    
    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads(async (header) => {

      const blockNumber = header.number.toNumber();

      const sessionInfo = await api.derive.session.info();
      const currentSessionIndex = sessionInfo.currentIndex.toNumber();
      logger.info(loggerOptions, `currentSessionIndex: ${currentSessionIndex}, currentKnownSessionIndex: ${currentKnownSessionIndex}`);
      if (currentSessionIndex > currentKnownSessionIndex) {
        currentKnownSessionIndex = currentSessionIndex;
        await module.exports.storeSessionStakingInfo(api, pool, blockNumber, sessionInfo);
      }
    });
  },
  storeSessionStakingInfo: async function (api, pool, blockNumber, sessionInfo) {

    // Start execution
    const startTime = new Date().getTime();
    
    const currentIndex = sessionInfo.currentIndex.toNumber();
    logger.info(loggerOptions, `Storing validators staking info for session #${currentIndex} (block #${blockNumber})`);
    
    //
    // Get active validators, next elected, nominators and waitingInfo
    //
    logger.info(loggerOptions, `Get active validators, next elected, nominators and waitingInfo`);
    const [validatorAddresses, { nextElected }, nominators, { info }] = await Promise.all([
      api.query.session.validators(),
      api.derive.staking.overview(),
      api.query.staking.nominators.entries(),
      api.derive.staking.waitingInfo()
    ]);

    //
    // Validator staking info
    //
    logger.info(loggerOptions, `Getting validator staking info`);
    let validatorStaking = [];
    validatorStaking = await Promise.all(
      validatorAddresses
        .map(authorityId => api.derive.staking.account(authorityId)
          .then((validator) => {
            return {
              ...validator,
              sessionIdHex: validator.sessionIds.length !== 0 ? validator.sessionIds.toHex() : ``,
              nextSessionIdHex: validator.nextSessionIds.length !== 0 ? validator.nextSessionIds.toHex() : ``,
              nextElected: nextElected.includes(validator.accountId),
            }
          }
        )
      )
    );

    //
    // Add identity
    //
    logger.info(loggerOptions, `Getting validator identities`);
    validatorStaking = await Promise.all(
      validatorStaking.map((validator) =>
        api.derive.accounts.info(validator.accountId).then(({ identity }) => {
          return {
            ...validator,
            identity,
            displayName: getDisplayName(identity),
          }
        })
      )
    )

    //
    // Get nominations
    //
    logger.info(loggerOptions, `Getting nominations`);
    const nominations = nominators.map(([key, nominations]) => {
      const nominator = key.toHuman()[0];
      const targets = nominations.toHuman().targets;
      return {
        nominator,
        targets
      }
    });
    const allNominatorAddresses = nominations.map(nomination => nomination.nominator);

    // Get nominator identities
    logger.info(loggerOptions, `Getting nominator identities`);
    const allNominatorIdentities = await Promise.all(
      allNominatorAddresses.map(accountId => api.derive.accounts.info(accountId))
    );
    
    logger.info(loggerOptions, `Getting validator stakers`);
    const validatorRows = validatorStaking
      .map((validator) => {
        let stakers = [];
        for(let j = 0; j < validator.exposure.others.length; j++) {
          let nomination = validator.exposure.others[j];
          let displayName = ``
          const identity = allNominatorIdentities.find(identity => identity.accountId.toString() === nomination.who.toString());
          if (identity) {
            displayName = getDisplayName(identity.identity); 
          }
          stakers.push({
            who: nomination.who,
            displayName,
            value: nomination.value,
            rank: 0
          })
        }
        stakers = stakers
          .sort((a, b) => {
            const A = new BigNumber(a.value);
            const B = new BigNumber(b.value);
            return A.lt(B) ? 1 : -1;
          })
          .map((staker, index) => {
            return {
              rank: index + 1,
              ...staker,
            }
          });
        return {
          ...validator,
          stakers,
        }
      })
      .sort((a, b) => {
        const A = new BigNumber(a.exposure.total);
        const B = new BigNumber(b.exposure.total);
        return A.lt(B) ? 1 : -1;
      })
      .map((validator, index) => {
        return {
          rank: index + 1,
          ...validator,
        }
      })
      .map(validator => {
        return [
          blockNumber,
          currentIndex,
          validator.accountId,
          validator.controllerId,
          validator.stashId,
          validator.rank,
          JSON.stringify(validator.stakers),
          JSON.stringify(validator.identity),
          validator.displayName,
          JSON.stringify(validator.exposure),
          validator.exposure.total,
          validator.exposure.own,
          validator.exposure.others,
          JSON.stringify(validator.nominators),
          validator.rewardDestination,
          validator.stakingLedger,
          JSON.stringify(validator.validatorPrefs),
          validator.validatorPrefs.commission,
          validator.sessionIds,
          validator.nextSessionIds,
          validator.sessionIdHex,
          validator.nextSessionIdHex,
          validator.redeemable,
          validator.nextElected,
          0,
          Date.now()
        ]
      });

    //
    // Populate validator table
    //
    logger.info(loggerOptions, `Populating validators table`);
    const sql = format(`
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
        next_elected,
        produced_blocks,
        timestamp
      ) VALUES %L`, validatorRows);
    try {
      await pool.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error inserting data in validator table: ${JSON.stringify(error)}`);
    }

    // Log validator execution time
    const validatorEndTime = new Date().getTime();
    logger.info(loggerOptions, `Stored validator staking info in ${((validatorEndTime - startTime) / 1000).toFixed(3)}s`);
    
    //
    // Fetch intention validators
    //
    logger.info(loggerOptions, `Storing intentions staking info for session #${currentIndex} (block #${blockNumber}`);
  
    //
    // Get intention staking info
    //
    logger.info(loggerOptions, `Getting intention staking info`);
    let intentionStaking = []
    intentionStaking = info
      .map(intention => {
        return {
          ...intention,
          sessionIdHex: intention.sessionIds ? intention.sessionIds.toHex() : ``,
          nextSessionIdHex: intention.nextSessionIds ? intention.nextSessionIds.toHex() : ``,
          nextElected: nextElected.includes(intention.accountId),
          stakers: nominations
            .filter(nomination => nomination.targets.some(target => target === intention.accountId.toString()))
            .map(nomination => nomination.nominator),
        }
      })
      .sort((a, b) => {
        const A = new BigNumber(a.stakingLedger.total);
        const B = new BigNumber(b.stakingLedger.total);
        return A.lt(B) ? 1 : -1;
      })
      .map((intention, index) => {
        return {
          rank: index + 1,
          ...intention,
        }
      });


    //
    // Add identity
    //
    logger.info(loggerOptions, `Getting intention identities`);
    intentionStaking = await Promise.all(
      intentionStaking.map((intention) =>
        api.derive.accounts.info(intention.accountId).then(({ identity }) => {
          return {
            ...intention,
            identity,
            displayName: getDisplayName(identity),
          }
        })
      )
    )

    //
    // Populate intention table
    //
    logger.info(loggerOptions, `Populating intentions table`);
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

    // Log validator execution time
    const intentionEndTime = new Date().getTime();
    logger.info(loggerOptions, `Stored intention staking info in ${((intentionEndTime - validatorEndTime) / 1000).toFixed(3)}s`);

    //
    // Nominators
    //
    logger.info(loggerOptions, `Storing nominator info for session #${currentIndex} (block #${blockNumber}`);

    // Get nominator balances
    logger.info(loggerOptions, `Getting nominator balances`);
    const allNominatorBalances = await Promise.all(
      allNominatorAddresses.map(accountId => api.derive.balances.all(accountId))
    );
    
    //
    // Populate nominator table
    //
    logger.info(loggerOptions, `Populating nominators table`);
    let nominatorStaking = [];
    for (let i = 0; i < validatorStaking.length; i++) {
      let validator = validatorStaking[i];
      if (validator.exposure.others.length > 0) {
        for (let j = 0; j < validator.exposure.others.length; j++) {
          let exposure = validator.exposure.others[j];
          if (
            nominatorStaking.find(nom => nom.accountId === exposure.who.toString())
          ) {
            let nominatorTmp = nominatorStaking.find(nom => nom.accountId === exposure.who.toString());

            let totalStakedBN = new BigNumber(exposure.value.toString());
            nominatorTmp.totalStakedBN = nominatorTmp.totalStakedBN.plus(
              totalStakedBN
            );
            nominatorTmp.totalStaked = nominatorTmp.totalStakedBN.toString();
            nominatorTmp.nominations++;
            nominatorTmp.targets.push({
              validator: validator.accountId,
              displayName: validator.displayName,
              amount: exposure.value
            });
          } else {
            let totalStakedBN = new BigNumber(exposure.value.toString());
            const bonded = await api.query.staking.bonded(exposure.who);
            let balances = allNominatorBalances.find(balance => balance.accountId.toString() === exposure.who.toString());
            let displayName = ``;
            const identity = allNominatorIdentities.find(identity => identity.accountId.toString() === exposure.who.toString());
            if (identity) {
              displayName = getDisplayName(identity); 
            }
            // hack! retry if not defined, weird but happens!
            if (!balances) {
              balances = await api.derive.balances.all(exposure.who);
            }

            const availableBalance = balances.availableBalance.toString();
            const freeBalance = balances.freeBalance.toString();
            const lockedBalance = balances.lockedBalance.toString();
            const nonce = balances.accountNonce.toString();

            nominatorStaking.push({
              rank: 0,
              accountId: exposure.who.toString(),
              stashId: exposure.who.toString(),
              controllerId: bonded.toString(),
              identity: identity ? identity : ``,
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
                  amount: exposure.value
                }
              ]
            });
          }
        }
      }
    }
    
    // Sort by total staked
    logger.info(loggerOptions, `Sorting nominators by total staked`);
    nominatorStaking.sort((a, b) => {
      const A = new BigNumber(a.totalStaked);
      const B = new BigNumber(b.totalStaked);
      return A.lt(B) ? 1 : -1;
    });

    logger.info(loggerOptions, `Populating nominators table`);
    rank = 1;
    for(let i = 0; i < nominatorStaking.length; i++) {
      const nominator = nominatorStaking[i];
      const sql = 
        `INSERT INTO nominator (
          block_height,
          session_index,
          account_id,
          controller_id,
          stash_id,
          rank,
          total_staked,
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
          '${rank}',
          '${nominator.totalStaked}',
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
        logger.info(loggerOptions, `Added nominator #${rank} ${nominator.accountId}`);
        rank++;
      } catch (error) {
        logger.error(loggerOptions, `Error adding nominator ${nominator.accountId}: ${error}, sql: ${sql}`);
      }
    }

    // Log validator execution time
    const nominatorEndTime = new Date().getTime();
    logger.info(loggerOptions, `Stored nominator info in ${((nominatorEndTime - intentionEndTime) / 1000).toFixed(3)}s`);

  }
}
    