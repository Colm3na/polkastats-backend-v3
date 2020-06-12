// @ts-check
const pino = require('pino');
const {BigNumber} = require('bignumber.js');

const logger = pino();

module.exports = {
  start: async function (api, pool, _config) {

    logger.info(`Starting rewards crawler...`);
    let currentDBEraIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT era_index FROM rewards ORDER BY era_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currentDBEraIndex = parseInt(res.rows[0]["era_index"]);
      logger.info(`Last era index in DB is #${currentDBEraIndex}`);
    } else {
      logger.info(`First execution, no era index found in DB!`);
      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = activeEra.index;
      currentDBEraIndex = currentEraIndex;
      const block = await api.rpc.chain.getBlock()
      const blockNumber = block.block.header.number.toNumber()
      await module.exports.storeEraRewardsSlashes(api, pool, blockNumber, currentEraIndex);
    }

    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads( async (header) => {

      // Get block number
      const blockNumber = header.number.toNumber();

      // Retrieve the active era
      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = activeEra.index;

      if (currentEraIndex > currentDBEraIndex) {
        currentDBEraIndex = currentEraIndex;
        await module.exports.storeEraRewardsSlashes(api, pool, blockNumber, currentEraIndex);
      }
    });
  },
  storeEraRewardsSlashes: async function (api, pool, blockNumber, currentEraIndex) {

    //
    // We want the rewards and slashes for the LAST era
    //
    const lastEraIndex = currentEraIndex - 1;
    logger.info(`Storing rewards at block #${blockNumber} for era #${lastEraIndex}`);

    // Get reward for last era
    const eraRewards = await api.query.staking.erasValidatorReward(lastEraIndex);

    // Get validator and nominator slashes for last era
    const eraSlahes = await api.derive.staking.eraSlashes(lastEraIndex);
    const eraValidatorSlashes = eraSlahes.validators;
    const eraNominatorSlashes = eraSlahes.nominators;

    for (const validator in eraValidatorSlashes) {
      const amount = eraValidatorSlashes[validator].toString();
      const sqlInsert = `INSERT INTO validator_slashes_era (block_number, era_index, account_id, amount, timestamp) 
      VALUES ('${blockNumber}', '${lastEraIndex}', '${validator}', '${amount}', extract(epoch from now()));`;
      try {        
        logger.info(`Adding validator slash for ${validator} in era ${lastEraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} KSM`);
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(`Error adding validator slash ${JSON.stringify(error)}`);
      }
    }

    for (const nominator in eraNominatorSlashes) {
      const amount = eraNominatorSlashes[nominator].toString();
      const sqlInsert = `INSERT INTO nominator_slashes_era (block_number, era_index, account_id, amount, timestamp) 
      VALUES ('${blockNumber}', '${lastEraIndex}', '${nominator}', '${amount}', extract(epoch from now()));`;
      try {
        logger.info(`Adding nominator slash for ${nominator} in era ${lastEraIndex}: ${new BigNumber(amount).dividedBy(1e12).toNumber().toFixed(3)} KSM`);
        await pool.query(sqlInsert);
      } catch (error) {
        logger.error(`Error adding nominator slash ${JSON.stringify(error)}`);
      }
    }

    // Get era points
    let eraPoints = await api.query.staking.erasRewardPoints(lastEraIndex);
    let validatorEraPoints = [];
    eraPoints.individual.forEach((val, index) => { validatorEraPoints.push({accountId: index.toHuman(), points: val}); });
    const totalEraPoints = eraPoints.total.toNumber();

    // Retrieve all exposures for the last era
    const exposures = await api.query.staking.erasStakers.entries(lastEraIndex);
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
      endEraValidatorList.map(accountId => api.query.staking.erasValidatorPrefs(lastEraIndex, accountId))
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

      // Estimated earnings for 100 KSM in this era
      const stakeAmount = new BigNumber(100 * 1e12);
      const userStakeFraction = stakeAmount.dividedBy(new BigNumber(exposure.total).plus(stakeAmount));
      const estimatedPayout = userStakeFraction.multipliedBy(poolRewardWithoutCommission);
      const estimatedPayoutKSM = estimatedPayout.dividedBy(1e12).toNumber().toFixed(3);

      const sql = `INSERT INTO rewards (block_number, era_index, stash_id, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
        VALUES ('${blockNumber}', '${lastEraIndex}', '${validator}', '${eraValidatorCommission[index].commission}', '${poolRewardWithCommission.toString(10)}', '${eraPoints}', '${JSON.stringify(exposure)}', '${estimatedPayout.toFixed(0)}', extract(epoch from now()))
        ON CONFLICT ON CONSTRAINT rewards_pkey 
        DO NOTHING
        `;
      try {
        logger.info(`Adding reward for validator ${validator}, era: ${lastEraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} KSM, reward: ${poolRewardWithCommissionKSM} KSM (without ${commission}% = ${poolRewardWithoutCommissionKSM} KSM), estimated era profit for 1000 KSM: ${estimatedPayoutKSM} KSM`);
        await pool.query(sql);
      } catch (error) {
        logger.error(`Error adding reward for validator ${validator} and era ${lastEraIndex}`);
      }
    })
    return true;
  }
}