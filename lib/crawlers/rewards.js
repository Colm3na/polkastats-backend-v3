const axios = require('axios');
const { BigNumber } = require('bignumber.js');

module.exports = {
  start: async function (api, pool, _config) {
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting rewards crawler...\x1b[0m`);

    let currentDBEraIndex;

    // Get last era index stored in DB
    const sqlSelect = `SELECT era_index FROM rewards ORDER BY era_index DESC LIMIT 1`;
    const res = await pool.query(sqlSelect);
    if (res.rows.length > 0) {
      currentDBEraIndex = parseInt(res.rows[0]["era_index"]);
      console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mLast era index stored in DB is #${currentDBEraIndex}\x1b[0m`);
    } else {
      console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mFirst execution, no era index found in DB!\x1b[0m`);
      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = activeEra.index;
      currentDBEraIndex = currentEraIndex;
      const block = await api.rpc.chain.getBlock()
      const blockNumber = block.block.header.number.toNumber()
      await module.exports.storeRewardsInfo(api, pool, blockNumber, currentEraIndex);
    }

    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads( async (header) => {

      // Get block number
      const blockNumber = header.number.toNumber();

      // Retrieve the active era
      let activeEra = await api.query.staking.activeEra();
      activeEra = JSON.parse(JSON.stringify(activeEra));
      const currentEraIndex = activeEra.index;
      // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mCurrent era index is #${currentEraIndex}\x1b[0m`);

      if (currentEraIndex > currentDBEraIndex) {
        currentDBEraIndex = currentEraIndex;
        await module.exports.storeRewardsInfo(api, pool, blockNumber, currentEraIndex);
      }
    });
  },
  storeRewardsInfo: async function (api, pool, blockNumber, currentEraIndex) {

    //
    // We want the rewards for the LAST era
    //
    const eraIndex = currentEraIndex - 1;
    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mStoring rewards at block #${blockNumber} for era #${eraIndex}\x1b[0m`);

    // Get last era rewards
    let eraRewards = await api.query.staking.erasValidatorReward(eraIndex);
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mRewards for era #${eraIndex}: ${JSON.stringify(eraRewards, null, 2)}\x1b[0m`);

    // Get last era points
    let eraPoints = await api.query.staking.erasRewardPoints(eraIndex);
    let validatorEraPoints = [];
    eraPoints.individual.forEach((val, index) => { validatorEraPoints.push({accountId: index.toHuman(), points: val}); });
    const totalEraPoints = eraPoints.total.toNumber();
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mEra points for era #${eraIndex}: ${JSON.stringify(validatorEraPoints, null, 2)}\x1b[0m`);
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mTotal era points for era #${eraIndex}: ${totalEraPoints}\x1b[0m`);

    // Retrieve all exposures for the last era
    const exposures = await api.query.staking.erasStakers.entries(currentEraIndex - 1);
    const eraExposures = exposures.map(([key, exposure]) => {
      return {
        accountId: key.args[1].toHuman(),
        exposure: JSON.parse(JSON.stringify(exposure))
      }
    });
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mExposures for era #${eraIndex}: ${JSON.stringify(eraExposures, null, 2)}\x1b[0m`);

    // Get all validator addresses in the last era
    const endEraValidatorList = eraExposures.map(exposure => {
      return exposure.accountId;
    });
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mValidator list for era #${eraIndex}: ${JSON.stringify(endEraValidatorList, null, 2)}\x1b[0m`);

    // Get total stake in the last era
    const eraTotalStake = await api.query.staking.erasTotalStake(eraIndex);
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mTotal stake for era #${eraIndex}: ${new BigNumber(eraTotalStake).dividedBy(1e12).toNumber().toFixed(3)} KSM\x1b[0m`);

    // Get validator commission for the last era (in same order as endEraValidatorList)
    const eraValidatorCommission = await Promise.all(
      endEraValidatorList.map(accountId => api.query.staking.erasValidatorPrefs(eraIndex, accountId))
    );
    // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mValidator preferences for era #${eraIndex}: ${JSON.stringify(eraValidatorCommission, null, 2)}\x1b[0m`);

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

      // Estimated earnings for 1000 KSM in this era
      const stakeAmount = new BigNumber(1000 * 1000000000000);
      const userStakeFraction = stakeAmount.dividedBy(new BigNumber(exposure.total).plus(stakeAmount));
      const estimatedPayout = userStakeFraction.multipliedBy(poolRewardWithoutCommission);
      const estimatedPayoutKSM = estimatedPayout.dividedBy(1000000000000).toNumber().toFixed(3);

      let sqlInsert = `INSERT INTO rewards (block_number, era_index, stash_id, commission, era_rewards, era_points, stake_info, estimated_payout, timestamp) 
        VALUES ('${blockNumber}', '${eraIndex}', '${validator}', '${eraValidatorCommission[index].commission}', '${poolRewardWithCommission.toString(10)}', '${eraPoints}', '${JSON.stringify(exposure)}', '${estimatedPayout.toFixed(0)}', extract(epoch from now()));`;
      try {
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32m=> Adding reward for validator ${validator}, era: ${eraIndex}, commission: ${commission}%, points: ${eraPoints} (${eraPointsPercent}%), exposure: ${totalExposure} KSM, reward: ${poolRewardWithCommissionKSM} KSM (without ${commission}% = ${poolRewardWithoutCommissionKSM} KSM), estimated era profit for 1000 KSM: ${estimatedPayoutKSM} KSM\x1b[0m`);
        const res = await pool.query(sqlInsert);
      } catch (error) {
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mSQL: ${sqlInsert}\x1b[0m`);
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
      }

    })

    return true;
  }
}
