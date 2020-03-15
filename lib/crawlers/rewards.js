// @ts-check

const axios = require('axios');
const {BigNumber} = require('bignumber.js');

let crawlerIsRunning = false;

function getAddressesFromExposures(exposures) {
  return exposures.map(exposure => {
    if (!exposure[0]) {
      throw Error('Exposure is empty');
    }
    // using kind of a back door
    const [, address] = exposure[0]._args;

    return address.toHuman();
  });
}

module.exports = {
  start: async function (api, pool, _config) {
    console.log(`[PolkaStats backend v3] - \x1b[32mStarting rewards crawler...\x1b[0m`);

    // Subscribe to new blocks
      await api.rpc.chain.subscribeNewHeads( async (header) => {

        let currentDBIndex;
    
        // Get block number
        const blockNumber = header.number.toNumber();

        // Retrieve the active era
        let activeEra = await api.query.staking.activeEra();
        activeEra = JSON.parse(JSON.stringify(activeEra));
        const currentEraIndex = activeEra.index;
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mCurrent era index is #${currentEraIndex}\x1b[0m`);
    
        // Get last index stored in DB
        const sqlSelect = `SELECT era_index FROM rewards ORDER BY era_index DESC LIMIT 1`;
        const res = await pool.query(sqlSelect);
        if (res.rows.length > 0) {
          currentDBIndex = parseInt(res.rows[0]["era_index"]);
          console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mLast era index stored in DB is #${currentDBIndex}\x1b[0m`);
        } else {
          currentDBIndex = 0;
          if (!crawlerIsRunning) {
            console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mFirst execution, no era index found in DB!\x1b[0m`);
          }
        }

        if (currentEraIndex > currentDBIndex) {
          if (!crawlerIsRunning) {
            await module.exports.storeRewardsInfo(api, pool, blockNumber, currentEraIndex);
          }
        }
    });
  },
  storeRewardsInfo: async function (api, pool, blockNumber, currentEraIndex) {
    crawlerIsRunning = true;
    
    // We store the rewards for the LAST era
    const eraIndex = currentEraIndex - 1;

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mStoring rewards at block #${blockNumber} for era #${eraIndex}\x1b[0m`);

    let eraRewards = await api.query.staking.erasValidatorReward(eraIndex);

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mEra rewards for era #${eraIndex}: ${JSON.stringify(eraRewards, null, 2)}\x1b[0m`);

    let eraPoints = await api.query.staking.erasRewardPoints(eraIndex);

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mEra points for era #${eraIndex}: ${JSON.stringify(eraPoints, null, 2)}\x1b[0m`);

    // Retrieve all exposures for the last era
    const exposures = await api.query.staking.erasStakers.entries(currentEraIndex);

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mExposures for era #${eraIndex}: ${JSON.stringify(exposures, null, 2)}\x1b[0m`);

    // get all validator addresses in the last era
    const endEraValidatorList = getAddressesFromExposures(exposures);

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mValidator list for era #${eraIndex}: ${JSON.stringify(endEraValidatorList, null, 2)}\x1b[0m`);

    // if (allRewards && allRewards.constructor === Array) {
    //   allRewards.forEach( async reward => {
    //     let sqlInsert = `INSERT INTO rewards (block_number, session_index, stash_id, era_rewards, stake_info, timestamp) 
    //       VALUES ('${blockNumber}', '${currentSessionIndex}', '${JSON.stringify(reward.stash_id)}', '${JSON.stringify(reward.eraRewards.join(''))}', '${JSON.stringify(reward.stake_info)}', extract(epoch from now()));`;
    //     try {
    //       const res = await pool.query(sqlInsert);
    //       console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mResponse from Database is ${JSON.stringify(res)}]`)
    //     } catch (error) {
    //       console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mSQL: ${sqlInsert}\x1b[0m`);
    //       console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
    //     }
    //   })
    // }
  }
}