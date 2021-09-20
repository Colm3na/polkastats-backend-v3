import pino from 'pino'
import BigNumber from 'bignumber.js'
import { setTimeout } from 'timers/promises'
import { Pool } from 'pg';
import { ApiPromise } from '@polkadot/api';

const logger = pino()

export function formatNumber(num: any): string {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function shortHash(hash: string): string {
  return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
}

export async function wait(ms: number) {
  await setTimeout(ms)
}

export async function storeExtrinsics(
  pool: Pool,
  blockNumber: any,
  extrinsics: any,
  blockEvents: any,
  loggerOptions: any
): Promise<void> {
  const startTime: number = new Date().getTime()
  extrinsics.forEach(async (extrinsic: any, index: number) => {
    const isSigned = extrinsic.isSigned;
    const signer: string = isSigned ? extrinsic.signer.toString() : ``;
    const section: any = extrinsic.toHuman().method.section;
    const method: any = extrinsic.toHuman().method.method;
    const args: any = JSON.stringify(extrinsic.args);
    const hash: any = extrinsic.hash.toHex();
    const doc: string = extrinsic.meta.docs.toString().replace(/'/g, "''");
    const success: any = getExtrinsicSuccess(index, blockEvents);

    const sql: string = `INSERT INTO extrinsic (
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
      await pool.query(sql)
      logger.info(
        loggerOptions,
        `Added extrinsic ${blockNumber}-${index} (${shortHash(
          hash
        )}) ${section} ➡ ${method}`
      )
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(
          error
        )}`
      );
    }
  })

  const endTime: number = new Date().getTime();
  logger.info(
    loggerOptions,
    `Added ${extrinsics.length} extrinsics in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`
  );
}

export async function storeLogs(pool: Pool, blockNumber: any, logs: any, loggerOptions: any): Promise<void> {
  const startTime: number = new Date().getTime();

  logs.forEach(async (log: any, index: number) => {
    const { type } = log;
    const [[engine, data]] = Object.values(log.toJSON());

    const sql: string = `INSERT INTO log (
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
      logger.error(
        loggerOptions,
        `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`
      );
    }
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`
  );
}

export function getExtrinsicSuccess(index: number, blockEvents: any): boolean {
  if (blockEvents.length === 0) {
    return true;
  }
  let extrinsicSuccess = false;
  blockEvents.forEach((record: any) => {
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
}

export function getDisplayName(identity: any): string {
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

export async function storeEraStakingInfo(api: ApiPromise, pool: Pool, eraIndex: any, denom: any, loggerOptions: any): Promise<any> {
  if (eraIndex === 0) return;
  logger.info(loggerOptions, `Storing staking info for era #${eraIndex}`);

  // Get reward for era
  const eraRewards: any = await api.query.staking.erasValidatorReward(eraIndex);

  // Get era points
  let eraPoints: any = await api.query.staking.erasRewardPoints(eraIndex);
  let validatorEraPoints: Array<any> = [];
  eraPoints.individual.forEach((val: any, index: any) => {
    validatorEraPoints.push({ accountId: index.toHuman(), points: val });
  });
  const totalEraPoints: number = eraPoints.total.toNumber();

  const exposures: Array<any> = await api.query.staking.erasStakers.entries(eraIndex);
  const eraExposures: Array<any> = exposures.map(([key, exposure]) => {
    return {
      accountId: key.args[1].toHuman(),
      exposure: JSON.parse(JSON.stringify(exposure)),
    };
  });

  const endEraValidatorList: Array<any> = eraExposures.map((exposure) => {
    return exposure.accountId;
  });

  // Get validator and nominator slashes for era
  const eraSlahes: any = await api.derive.staking.eraSlashes(eraIndex);
  const eraValidatorSlashes: Array<any> = Object.values(eraSlahes.validators);
  const eraNominatorSlashes: Array<any> = Object.values(eraSlahes.nominators);

  endEraValidatorList.forEach(async (validator: any, index: number) => {
    const slash: any = eraValidatorSlashes.find((slash) => slash[0] === validator);
    if (slash) {
      const amount = slash[1];
      const sql = `INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '${amount}', '${Date.now()}')
        ON CONFLICT ON CONSTRAINT validator_era_slash_pkey 
        DO NOTHING;`;
      try {
        logger.info(
          loggerOptions,
          `Adding validator slash for ${validator} in era ${eraIndex}: ${new BigNumber(
            amount
          )
            .dividedBy(1e12)
            .toNumber()
            .toFixed(3)} ${denom}`
        );
        await pool.query(sql);
      } catch (error) {
        logger.error(
          loggerOptions,
          `Error adding validator slash for ${validator} in era ${eraIndex}: ${JSON.stringify(
            error
          )}`
        );
      }
    } else {
      const sql = `INSERT INTO validator_era_slash (era_index, stash_id, amount, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '0', '${Date.now()}')
        ON CONFLICT ON CONSTRAINT validator_era_slash_pkey 
        DO NOTHING;`;
      try {
        logger.info(
          loggerOptions,
          `Adding validator slash for ${validator} in era ${eraIndex}`
        );
        await pool.query(sql);
      } catch (error) {
        logger.error(
          loggerOptions,
          `Error adding validator slash for ${validator} in era ${eraIndex}: ${JSON.stringify(
            error
          )}`
        );
      }
    }
  })

  for (const slash in eraNominatorSlashes) {
    const nominator = slash[0];
    const amount = slash[1];
    const sqlInsert: string = `INSERT INTO nominator_era_slash (era_index, stash_id, amount, timestamp) 
      VALUES ('${eraIndex}', '${nominator}', '${amount}', '${Date.now()}')
      ON CONFLICT ON CONSTRAINT nominator_era_slash_pkey 
      DO NOTHING
      ;`;
    try {
      logger.info(
        loggerOptions,
        `Adding nominator slash for ${nominator} in era ${eraIndex}: ${new BigNumber(
          amount
        )
          .dividedBy(1e12)
          .toNumber()
          .toFixed(3)} ${denom}`
      );
      await pool.query(sqlInsert);
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding nominator slash for ${nominator} in era ${eraIndex}: ${JSON.stringify(
          error
        )}`
      );
    }
  }

  const eraValidatorCommission: any = await Promise.all(
    endEraValidatorList.map((accountId) =>
      api.query.staking.erasValidatorPrefs(eraIndex, accountId)
    )
  );

  endEraValidatorList.forEach(async (validator, index) => {
    const { identity } = await api.derive.accounts.info(validator);
    const displayName: string = getDisplayName(identity);

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
    const sql: string = `INSERT INTO validator_era_staking (era_index, stash_id, identity, display_name, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
        VALUES ('${eraIndex}', '${validator}', '${JSON.stringify(
      identity
    )}', '${displayName}', '${eraValidatorCommission[index].commission
      }', '${poolRewardWithCommission.toString(
        10
      )}', '${eraPoints}', '${JSON.stringify(
        exposure
      )}', '${estimatedPayout.toFixed(0)}', '${Date.now()}')
        ON CONFLICT ON CONSTRAINT validator_era_staking_pkey 
        DO NOTHING
        `;
    try {
      logger.info(
        loggerOptions,
        `Adding staking info for validator ${validator} and era: ${eraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} ${denom}, reward: ${poolRewardWithCommissionKSM} ${denom} (without ${commission}% = ${poolRewardWithoutCommissionKSM} ${denom}), estimated era profit for 1000 ${denom}: ${estimatedPayoutKSM} ${denom}`
      );
      await pool.query(sql);
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding staking info for validator ${validator} and era ${eraIndex}: ${JSON.stringify(
          error
        )}`
      );
    }
  })

  return true;
}

export async function updateTotals(pool: Pool, loggerOptions: any): Promise<void> {
  const sql: string = `
  UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
  UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
  UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
  UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events'
  UPDATE collection SET count (SELECT count(*) FROM collection) WHERE name ='collection'
  ;`;

  try {
    await pool.query(sql)
  } catch (error) {
    logger.error(loggerOptions, `Error updating total harvested blocks, extrinsics and events: ${error}`)
  }
}

export function parseHexToString(value: any): string | null {
  try {
    const source = value.toString().replace('0x', '')
    return new Buffer(source, 'hex').toString('utf-8')
  } catch (error) {
    return ''
  }
}

export function bufferToString(value: any): string | null {
  try {
    return new Buffer(value, 'hex').toString('utf-8')
  } catch (error) {
    return null;
  }
}

export function genArrayRange(min: number, max: number) {
  return Array.from(
    { length: max - min },
    (_, i) => i + ((min === 0 ? -1 : min - 1) + 1)
  )
}