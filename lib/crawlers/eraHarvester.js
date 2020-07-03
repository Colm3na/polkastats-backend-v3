// @ts-check
const { BigNumber } = require('bignumber.js');
const pino = require('pino');
const logger = pino();
const { wait } = require('../utils.js');

const loggerOptions = {
  crawler: `eraHarvester`
};

const denoms = {
  polkadot: `DOT`,
  kusama: `KSM`,
  westend: `WND`
};

const POLLING_TIME = 2 * 60 * 1000;

module.exports = {
  start: async function (api, pool, _config, substrateNetwork) {

    const denom = denoms[substrateNetwork];

    logger.info(loggerOptions, `Starting eraHarvester crawler, delaying first execution for ${POLLING_TIME / 100}s ...`);
    await wait(POLLING_TIME);
    logger.info(loggerOptions, `Starting first execution...`)

    let activeEra = await api.query.staking.activeEra();
    activeEra = JSON.parse(JSON.stringify(activeEra));
    const currentEraIndex = activeEra.index;
    const historyDepth = await api.query.staking.historyDepth();

    if (currentEraIndex > 0) {
      for (let eraIndex = currentEraIndex - 1; eraIndex >= currentEraIndex - historyDepth && eraIndex > 0; eraIndex--) {
        const sql = `SELECT era_index FROM reward WHERE era_index = '${eraIndex}' LIMIT 1`;
        const res = await pool.query(sql);
        if (res.rows.length === 0) {
          await module.exports.storeEraRewardsSlashes(api, pool, eraIndex, denom);
        }
      }
    }    
  },
  storeEraRewardsSlashes: async function (api, pool, eraIndex, denom) {

    // Handle PoA, when there is no era change
    if (eraIndex === 0) return

    const blockNumber = 0;

    logger.info(loggerOptions, `Storing rewards for era #${eraIndex}`);

    // Get reward for last era
    const eraRewards = await api.query.staking.erasValidatorReward(eraIndex);

    // Get validator and nominator slashes for last era
    const eraSlahes = await api.derive.staking.eraSlashes(eraIndex);
    const eraValidatorSlashes = eraSlahes.validators;
    const eraNominatorSlashes = eraSlahes.nominators;

    for (const validator in eraValidatorSlashes) {
      const amount = eraValidatorSlashes[validator].toString();
      const sqlInsert = `INSERT INTO validator_slash_era (block_number, era_index, account_id, amount, timestamp) 
      VALUES ('${blockNumber}', '${eraIndex}', '${validator}', '${amount}', '${Date.now()}');`;
      try {        
        logger.info(loggerOptions, `Adding validator slash for ${validator} in era ${eraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} ${denom}`);
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(loggerOptions, `Error adding validator for ${validator} in era ${eraIndex}: ${JSON.stringify(error)}`);
      }
    }

    for (const nominator in eraNominatorSlashes) {
      const amount = eraNominatorSlashes[nominator].toString();
      const sqlInsert = `INSERT INTO nominator_slash_era (block_number, era_index, account_id, amount, timestamp) 
      VALUES ('${blockNumber}', '${eraIndex}', '${nominator}', '${amount}', '${Date.now()}');`;
      try {
        logger.info(loggerOptions, `Adding nominator slash for ${nominator} in era ${eraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} ${denom}`);
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(loggerOptions, `Error adding nominator slash ${JSON.stringify(error)}`);
      }
    }

    // Get era points
    let eraPoints = await api.query.staking.erasRewardPoints(eraIndex);
    let validatorEraPoints = [];
    eraPoints.individual.forEach((val, index) => { validatorEraPoints.push({accountId: index.toHuman(), points: val}); });
    const totalEraPoints = eraPoints.total.toNumber();

    // Retrieve all exposures for the last era
    const exposures = await api.query.staking.erasStakers.entries(eraIndex);
    const eraExposures = exposures.map(([key, exposure]) => {
      return {
        accountId: key.args[1].toHuman(),
        exposure: JSON.parse(JSON.stringify(exposure))
      }
    });

    // Get validator addresses for the last era
    const endEraValidatorList = eraExposures.map(exposure => {
      return exposure.accountId;
    });

    // Get validator commission for the last era (in same order as endEraValidatorList)
    const eraValidatorCommission = await Promise.all(
      endEraValidatorList.map(accountId => api.query.staking.erasValidatorPrefs(eraIndex, accountId))
    );

    endEraValidatorList.forEach( async (validator, index) => {

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

      const sql = `INSERT INTO reward (block_number, era_index, stash_id, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
        VALUES ('${blockNumber}', '${eraIndex}', '${validator}', '${eraValidatorCommission[index].commission}', '${poolRewardWithCommission.toString(10)}', '${eraPoints}', '${JSON.stringify(exposure)}', '${estimatedPayout.toFixed(0)}', '${Date.now()}')
        ON CONFLICT ON CONSTRAINT reward_pkey 
        DO NOTHING
        `;
      try {
        logger.info(loggerOptions, `Adding reward for validator ${validator}, era: ${eraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} ${denom}, reward: ${poolRewardWithCommissionKSM} ${denom} (without ${commission}% = ${poolRewardWithoutCommissionKSM} ${denom}), estimated era profit for 1000 ${denom}: ${estimatedPayoutKSM} ${denom}`);
        await pool.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error adding reward for validator ${validator} and era ${eraIndex}`);
      }
    })
    return true;
  }
}