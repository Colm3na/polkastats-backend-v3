const pino = require('pino');
const logger = pino();
const { BigNumber } = require('bignumber.js');

module.exports = {
  formatNumber: function (number) {
    return (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },
  shortHash: function (hash) {
    return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
  },
  wait: async function (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
  storeExtrinsics: async function (pool, blockNumber, extrinsics, blockEvents, loggerOptions) {
    // Start execution
    const startTime = new Date().getTime();

    extrinsics.forEach(async (extrinsic, index) => {

      const isSigned = extrinsic.isSigned;
      const signer = isSigned ? extrinsic.signer.toString() : ``;
      const section = extrinsic.toHuman().method.section;
      const method = extrinsic.toHuman().method.method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
      const success = module.exports.getExtrinsicSuccess(index, blockEvents);

      const sql = 
        `INSERT INTO extrinsic (
          block_number,
          extrinsic_index,
          is_signed,
          signer,
          section,
          method,
          args,
          hash,
          doc,
          success
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${isSigned}',
          '${signer}',
          '${section}',
          '${method}',
          '${args}',
          '${hash}',
          '${doc}',
          '${success}'
        )
        ON CONFLICT ON CONSTRAINT extrinsic_pkey 
        DO NOTHING;
        ;`;

      try {
        await pool.query(sql);
        logger.info(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
    });

    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeLogs: async function (pool, blockNumber, logs, loggerOptions) {
    // Start execution
    const startTime = new Date().getTime();

    logs.forEach(async (log, index) => {
      const { type } = log;
      const [ [ engine, data ] ] = Object.values(log.toJSON());

      const sql = 
        `INSERT INTO log (
          block_number,
          log_index,
          type,
          engine,
          data
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${type}',
          '${engine}',
          '${data}'
        )
        ON CONFLICT ON CONSTRAINT log_pkey 
        DO NOTHING;
        ;`;

      try {
        await pool.query(sql);
        logger.info(loggerOptions, `Added log ${blockNumber}-${index}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
      
    });

    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  getExtrinsicSuccess: function (index, blockEvents) {
    let extrinsicSuccess = false
    blockEvents.forEach((record) => {
      const { event, phase } = record
      if (
        parseInt(phase.toHuman().ApplyExtrinsic) === index &&
        event.section === `system` &&
        event.method === `ExtrinsicSuccess`
      ) {
        extrinsicSuccess = true
      }
    })
    return extrinsicSuccess
  },
  getDisplayName: function(identity) {
    if (
      identity.displayParent &&
      identity.displayParent !== `` &&
      identity.display &&
      identity.display !== ``
    ) {
      return `${identity.displayParent} / ${identity.display}`;
    } else {
      return identity.display || ``;
    }
  },
  storeEraStakingInfo: async function (api, pool, eraIndex, denom, loggerOptions) {

    // Handle PoA, when there is no era change
    if (eraIndex === 0) return

    logger.info(loggerOptions, `Storing staking info for era #${eraIndex}`);

    // Get reward for era
    const eraRewards = await api.query.staking.erasValidatorReward(eraIndex);

    // Get era points
    let eraPoints = await api.query.staking.erasRewardPoints(eraIndex);
    let validatorEraPoints = [];
    eraPoints.individual.forEach((val, index) => { validatorEraPoints.push({accountId: index.toHuman(), points: val}); });
    const totalEraPoints = eraPoints.total.toNumber();

    // Retrieve all exposures for the era
    const exposures = await api.query.staking.erasStakers.entries(eraIndex);
    const eraExposures = exposures.map(([key, exposure]) => {
      return {
        accountId: key.args[1].toHuman(),
        exposure: JSON.parse(JSON.stringify(exposure))
      }
    });

    // Get validator addresses for the era
    const endEraValidatorList = eraExposures.map(exposure => {
      return exposure.accountId;
    });

    // Get validator and nominator slashes for era
    const eraSlahes = await api.derive.staking.eraSlashes(eraIndex);
    const eraValidatorSlashes = Object.values(eraSlahes.validators);
    const eraNominatorSlashes = Object.values(eraSlahes.nominators);

    endEraValidatorList.forEach( async (validator, index) => {
      const slash = eraValidatorSlashes.find(slash => slash[0] === validator);
      if (slash) {
        const amount = slash[1];
        const sql = `INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '${amount}', '${Date.now()}');`;
        try {        
          logger.info(loggerOptions, `Adding validator slash for ${validator} in era ${eraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} ${denom}`);
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error adding validator slash for ${validator} in era ${eraIndex}: ${JSON.stringify(error)}`);
        }
      } else {
        const sql = `INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '0', '${Date.now()}');`;
        try {        
          logger.info(loggerOptions, `Adding validator slash for ${validator} in era ${eraIndex}`);
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error adding validator slash for ${validator} in era ${eraIndex}: ${JSON.stringify(error)}`);
        }
      }
    });
  
    for (const slash in eraNominatorSlashes) {
      const nominator = slash[0];
      const amount = slash[1];
      const sqlInsert = `INSERT INTO nominator_era_slash (era_index, stash_id, amount, timestamp) 
      VALUES ('${eraIndex}', '${nominator}', '${amount}', '${Date.now()}');`;
      try {
        logger.info(loggerOptions, `Adding nominator slash for ${nominator} in era ${eraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} ${denom}`);
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(loggerOptions, `Error adding nominator slash for ${nominator} in era ${eraIndex}: ${JSON.stringify(error)}`);
      }
    }

    // Get validator commission for the era (in same order as endEraValidatorList)
    const eraValidatorCommission = await Promise.all(
      endEraValidatorList.map(accountId => api.query.staking.erasValidatorPrefs(eraIndex, accountId))
    );

    endEraValidatorList.forEach( async (validator, index) => {

      const { identity } = await api.derive.accounts.info(validator);
      const displayName = module.exports.getDisplayName(identity);

      const commission = eraValidatorCommission[index].commission / 10000000;
      const exposure = eraExposures.find( exposure => exposure.accountId === validator).exposure;
      const totalExposure = new BigNumber(exposure.total).dividedBy(1e12).toNumber().toFixed(3);
      const endEraValidatorWithPoints = validatorEraPoints.find(item => item.accountId === validator)
      const eraPoints = endEraValidatorWithPoints ? endEraValidatorWithPoints.points.toNumber() : 0;
      
      const eraPointsPercent = (eraPoints * 100) / totalEraPoints;
      const poolRewardWithCommission = new BigNumber(eraRewards).dividedBy(100).multipliedBy(eraPointsPercent);
      const poolRewardWithCommissionKSM = poolRewardWithCommission.dividedBy(1e12).toNumber().toFixed(3);
      const commissionAmount = poolRewardWithCommission.dividedBy(100).multipliedBy(commission);
      const poolRewardWithoutCommission = poolRewardWithCommission.minus(commissionAmount);
      const poolRewardWithoutCommissionKSM = poolRewardWithCommission.minus(commissionAmount).dividedBy(1e12).toNumber().toFixed(3);

      // Estimated earnings for 100 tokens in this era
      const stakeAmount = new BigNumber(100 * 1e12);
      const userStakeFraction = stakeAmount.dividedBy(new BigNumber(exposure.total).plus(stakeAmount));
      const estimatedPayout = userStakeFraction.multipliedBy(poolRewardWithoutCommission);
      const estimatedPayoutKSM = estimatedPayout.dividedBy(1e12).toNumber().toFixed(3);

      const sql = `INSERT INTO validator_era_staking (era_index, stash_id, identity, display_name, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '${JSON.stringify(identity)}', '${displayName}', '${eraValidatorCommission[index].commission}', '${poolRewardWithCommission.toString(10)}', '${eraPoints}', '${JSON.stringify(exposure)}', '${estimatedPayout.toFixed(0)}', '${Date.now()}')
        ON CONFLICT ON CONSTRAINT validator_era_staking_pkey 
        DO NOTHING
        `;
      try {
        logger.info(loggerOptions, `Adding staking info for validator ${validator} and era: ${eraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} ${denom}, reward: ${poolRewardWithCommissionKSM} ${denom} (without ${commission}% = ${poolRewardWithoutCommissionKSM} ${denom}), estimated era profit for 1000 ${denom}: ${estimatedPayoutKSM} ${denom}`);
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error adding staking info for validator ${validator} and era ${eraIndex}: ${JSON.stringify(error)}`);
      }
    })
    return true;
  },
  updateTotals: async function (pool, loggerOptions) {
    let sql = `
      SELECT
        (SELECT count(*) FROM block) AS totalBlocks,
        (SELECT count(*) FROM extrinsic) AS totalExtrinsics,
        (SELECT count(*) FROM event) AS totalEvents;
    `;
    const res = await pool.query(sql);
    if (res.rows.length > 0) {
      totalBlocks = parseInt(res.rows[0]["totalBlocks"]);
      totalExtrinsics = parseInt(res.rows[0]["totalExtrinsics"]);
      totalEvents = parseInt(res.rows[0]["totalEvents"]);
      sql = `
        UPDATE total SET count = '${totalBlocks}' WHERE NAME = 'blocks';
        UPDATE total SET count = '${totalExtrinsics}' WHERE NAME = 'extrinsics';
        UPDATE total SET count = '${totalEvents}' WHERE NAME = 'events';
      `;
      try {
        logger.info(loggerOptions, `Updating total harvested blocks (${totalBlocks}), extrinsics (${totalExtrinsics}) and events (${totalEvents})`);
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error updating total harvested blocks, extrinsics and events: ${error}`);
      }
    }
  }
};