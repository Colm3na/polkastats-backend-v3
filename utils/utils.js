import pino from 'pino'
import BN  from 'bignumber.js'
import Sequelize from 'sequelize'

const { QueryTypes } = Sequelize
const { BigNumber } = BN; 

const logger = pino()


export function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function shortHash(hash) {
  return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
}

export async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getExtrinsicSuccess(index, blockEvents) {
  // assume success if no events were extracted
  if (blockEvents.length === 0) {
    return true;
  }
  let extrinsicSuccess = false;
  blockEvents.forEach((record) => {
    const { event, phase } = record;
    if (
      parseInt(phase.toHuman().ApplyExtrinsic) === index &&
      event.section === `system` &&
      event.method === `ExtrinsicSuccess`
    ) {
      extrinsicSuccess = true;
    }
  });
  return extrinsicSuccess;
};

export async function storeExtrinsics(
  sequelize,
  blockNumber,
  extrinsics,
  blockEvents,
  loggerOptions
) {
  // Start execution
  const startTime = new Date().getTime();
  extrinsics.forEach(async (extrinsic, index) => {
    const isSigned = extrinsic.isSigned;
    await sequelize.query(`INSERT INTO extrinsic (
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
      ':block_number',
      ':extrinsic_index',
      ':is_signed',
      ':signer',
      ':section',
      ':method',
      ':args',
      ':hash',
      ':doc',
      ':success'
    )
    ON CONFLICT ON CONSTRAINT extrinsic_pkey DO NOTHING;`,
      {
        type: QueryTypes.INSERT,
        replacements: {
          block_number: blockNumber,
          extrinsic_index: index,
          is_signed: isSigned,
          signer: isSigned ? extrinsic.signer.toString() : ``,
          section: extrinsic.toHuman().method.section,
          method: extrinsic.toHuman().method.method,
          args: JSON.stringify(extrinsic.args),
          hash: extrinsic.hash.toHex(),
          doc: extrinsic.meta.docs.toString().replace(/'/g, "''"),
          success: getExtrinsicSuccess(index, blockEvents)
        }
      })
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Added ${extrinsics.length} extrinsics in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`
  );
}

export async function storeLogs(sequelize, blockNumber, logs, loggerOptions) {
  const startTime = new Date().getTime();

  logs.forEach(async (log, index) => {
    const { type } = log;
    const [[engine, data]] = Object.values(log.toJSON());

    await sequelize.query(`INSERT INTO log (block_number, log_index, type, engine, data) 
    VALUES (:block_number, :log_index, :type, :engine, :data)
    ON CONFLICT ON CONSTRAINT log_pkey 
    DO NOTHING;`, {
      block_number: blockNumber,
      log_index: index,
      type,
      engine,
      data
    });
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`
  );
}

export function getDisplayName(identity) {
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
}

export async function storeEraStakingInfo(api, sequelize, eraIndex, denom, loggerOptions) {
  if (eraIndex === 0) return;
  logger.info(loggerOptions, `Storing staking info for era #${eraIndex}`);

  const eraRewards = await api.query.staking.erasValidatorReward(eraIndex);

  // Get era points
  let eraPoints = await api.query.staking.erasRewardPoints(eraIndex);
  let validatorEraPoints = [];
  eraPoints.individual.forEach((val, index) => {
    validatorEraPoints.push({ accountId: index.toHuman(), points: val });
  });
  const totalEraPoints = eraPoints.total.toNumber();
  // Retrieve all exposures for the era
  const exposures = await api.query.staking.erasStakers.entries(eraIndex);
  const eraExposures = exposures.map(([key, exposure]) => {
    return {
      accountId: key.args[1].toHuman(),
      exposure: JSON.parse(JSON.stringify(exposure)),
    };
  });

  // Get validator addresses for the era
  const endEraValidatorList = eraExposures.map((exposure) => {
    return exposure.accountId;
  });

  // Get validator and nominator slashes for era
  const eraSlahes = await api.derive.staking.eraSlashes(eraIndex);
  const eraValidatorSlashes = Object.values(eraSlahes.validators);
  const eraNominatorSlashes = Object.values(eraSlahes.nominators);

  endEraValidatorList.forEach(async (validator, index) => {
    const slash = eraValidatorSlashes.find((slash) => slash[0] === validator);
    if (slash) {
      const amount = slash[1];
      await sequelize.query(`INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) VALUES(:era_index, :stash_id, :amount, :timestamp)
      ON CONFLICT ON CONSTRAINT validator_era_slash_pkey 
      DO NOTHING;`, {
        type: QueryTypes.INSERT,
        replacements: {
          era_index: eraIndex,
          stash_id: validator,
          amount,
          timestamp: Date.now()
        }
      })
      logger.info(
        loggerOptions,
        `Adding validator slash for ${validator} in era ${eraIndex}: ${new BigNumber(
          amount
        )
          .dividedBy(1e12)
          .toNumber()
          .toFixed(3)} ${denom}`
      );
    } else {
      await sequelize.query(`INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) VALUES(:era_index, :stash_id, :amount, :timestamp)
      ON CONFLICT ON CONSTRAINT validator_era_slash_pkey 
      DO NOTHING;`, {
        type: QueryTypes.INSERT,
        replacements: {
          era_index: eraIndex,
          stash_id: validator,
          amount: 0,
          timestamp: Date.now()
        }
      })
      logger.info(
        loggerOptions,
        `Adding validator slash for ${validator} in era ${eraIndex}`
      );
    }
  });

  for (const slash in eraNominatorSlashes) {
    const nominator = slash[0];
    const amount = slash[1];
    await sequelize.query(`
    INSERT INTO nominator_era_slash (era_index, stash_id, amount, timestamp) VALUES(:era_index, :stash_id, :amount, :timestamp)   ON CONFLICT ON CONSTRAINT nominator_era_slash_pkey 
    DO NOTHING;`, {
      type: QueryTypes.INSERT,
      replacements: {
        era_index: eraIndex,
        stash_id: nominator,
        amount,
        timestamp: Date.now()
      }
    })
    logger.info(
      loggerOptions,
      `Adding nominator slash for ${nominator} in era ${eraIndex}: ${new BigNumber(
        amount
      )
        .dividedBy(1e12)
        .toNumber()
        .toFixed(3)} ${denom}`
    );
  }

  const eraValidatorCommission = await Promise.all(
    endEraValidatorList.map((accountId) =>
      api.query.staking.erasValidatorPrefs(eraIndex, accountId)
    )
  );

  endEraValidatorList.forEach(async (validator, index) => {
    const { identity } = await api.derive.accounts.info(validator);
    const displayName = module.exports.getDisplayName(identity);

    const commission = eraValidatorCommission[index].commission / 10000000;
    const exposure = eraExposures.find(
      (exposure) => exposure.accountId === validator
    ).exposure;
    const totalExposure = new BigNumber(exposure.total)
      .dividedBy(1e12)
      .toNumber()
      .toFixed(3);
    const endEraValidatorWithPoints = validatorEraPoints.find(
      (item) => item.accountId === validator
    );
    const eraPoints = endEraValidatorWithPoints
      ? endEraValidatorWithPoints.points.toNumber()
      : 0;

    const eraPointsPercent = (eraPoints * 100) / totalEraPoints;
    const poolRewardWithCommission = new BigNumber(eraRewards)
      .dividedBy(100)
      .multipliedBy(eraPointsPercent);
    const poolRewardWithCommissionKSM = poolRewardWithCommission
      .dividedBy(1e12)
      .toNumber()
      .toFixed(3);
    const commissionAmount = poolRewardWithCommission
      .dividedBy(100)
      .multipliedBy(commission);
    const poolRewardWithoutCommission =
      poolRewardWithCommission.minus(commissionAmount);
    const poolRewardWithoutCommissionKSM = poolRewardWithCommission
      .minus(commissionAmount)
      .dividedBy(1e12)
      .toNumber()
      .toFixed(3);

    // Estimated earnings for 100 tokens in this era
    const stakeAmount = new BigNumber(100 * 1e12);
    const userStakeFraction = stakeAmount.dividedBy(
      new BigNumber(exposure.total).plus(stakeAmount)
    );
    const estimatedPayout = userStakeFraction.multipliedBy(
      poolRewardWithoutCommission
    );
    const estimatedPayoutKSM = estimatedPayout
      .dividedBy(1e12)
      .toNumber()
      .toFixed(3);

    await sequelize.query(`INSERT INTO validator_era_staking (era_index, stash_id, identity, display_name, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
    VALUES (:era_index, :stash_id, :identity, :display_name, :commission, :era_rewards, :era_points, :stake_info, :estimated_payout, :timestamp) ON CONFLICT ON CONSTRAINT validator_era_staking_pkey 
    DO NOTHING;`, {
      type: QueryTypes.INSERT,
      replacements: {
        era_index: eraIndex,
        stash_id: validator,
        identity: JSON.stringify(identity),
        display_name: displayName,
        commission: eraValidatorCommission[index].commission,
        era_rewards: poolRewardWithCommission.toString(10),
        era_points: eraPoints,
        stake_info: JSON.stringify(exposure),
        estimated_payout: estimatedPayout.toFixed(0),
        timestamp: Date.now()
      }
    });
    logger.info(
      loggerOptions,
      `Adding staking info for validator ${validator} and era: ${eraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} ${denom}, reward: ${poolRewardWithCommissionKSM} ${denom} (without ${commission}% = ${poolRewardWithoutCommissionKSM} ${denom}), estimated era profit for 1000 ${denom}: ${estimatedPayoutKSM} ${denom}`
    );
  });
  return true;
}

export async function updateTotals(sequelize) {
  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM collections) WHERE name ='collections'`, { type: QueryTypes.UPDATE })

  await sequelize.query(`UPDATE total SET count = (SELECT count(*) FROM tokens) WHERE name ='tokens'`, { type: QueryTypes.UPDATE })
}

export function parseHexToString(value) {
  try {
    const source = value.toString().replace('0x', '')
    return Buffer.from(source, 'hex').toString('utf-8')
  } catch (error) {
    return ''
  }
}

export function bufferToString(value) {
  try {
    if (value.length === 0 || value.length <= 3) {
      return ''
    }
    if (value.join('').includes('123')) {
      return ''
    }
    return Buffer.from(value, 'hex').toString('utf-8')
  } catch (error) {
    return ''
  }
}

export function genArrayRange(min, max) {
  return Array.from(
    { length: max - min },
    (_, i) => i + ((min === 0 ? -1 : min - 1) + 1)
  );
}