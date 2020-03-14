// @ts-check

const axios = require('axios');
const {BigNumber} = require('bignumber.js');

let crawlerIsRunning = false;

module.exports = {
  rewards: async function (api, pool) {
    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads( async (header) => {

      let currentDBIndex;
  
      // Get block number
      const blockNumber = header.number.toNumber();
      // console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mNew block #${blockNumber}\x1b[0m`);
  
      // Get last index stored in DB
      const sqlSelect = `SELECT session_index FROM validator_staking ORDER BY session_index DESC LIMIT 1`;
      const res = await pool.query(sqlSelect);
      if (res.rows.length > 0) {
        currentDBIndex = parseInt(res.rows[0]["session_index"]);
        // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mLast session index stored in DB is #${currentDBIndex}\x1b[0m`);
      } else {
        currentDBIndex = 0;
        if (!crawlerIsRunning) {
          console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mFirst execution, no session index found in DB!\x1b[0m`);
        }
      }
  
      // Get current session index
      const session = await api.derive.session.info();
      const currentIndex = session.currentIndex.toNumber();
      // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[32mCurrent session index is #${currentIndex}\x1b[0m`);
      
      if (currentIndex > currentDBIndex) {
        if (!crawlerIsRunning) {
          await module.exports.storeRewardsInfo(api, pool, blockNumber, currentIndex);
        }
      }
    });
  },
  storeRewardsInfo: async function (api, pool, blockNumber, currentIndex) {
    crawlerIsRunning = true;
    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mStoring rewards at block #${blockNumber} (session #${currentIndex})\x1b[0m`);

      // Fetch staking information of elected validators
      const electedInfo = await api.derive.staking.electedInfo();

      // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mElected info: ${JSON.stringify(electedInfo)})\x1b[0m`);

      // Fetch last reward events from PolkaScan
      const response = await axios.default.get(`https://api-01.polkascan.io/kusama/api/v1/event?&filter[module_id]=staking&filter[event_id]=Reward`);

      const rewardEvents = response.data.data;

      // console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mLast rewards: ${JSON.stringify(rewardEvents)})\x1b[0m`);

      // Fetch rewards event info, retrieve hash, era points and
      // elected validators for all the blocks at the end of the era 
      let rewards = [];
      rewards = await Promise.all(
        rewardEvents.map(async event => {
          let reward_block_id = event.attributes.block_id;
          let value = event.attributes.attributes[0].value;
          let end_era_block_id = event.attributes.block_id - 1;
          let hash = await api.rpc.chain.getBlockHash(end_era_block_id);
          // let eraPoints = await api.query.staking.currentEraPointsEarned.at(hash.toString());
          // let endEraValidatorList = await api.query.staking.currentElected.at(hash.toString());
          // const session_index = await api.query.session.currentIndex.at(hash);

          // Retrieve the active era
          let activeEra = await api.query.staking.activeEra();
          activeEra = JSON.parse(JSON.stringify(activeEra));
          const currentEraIndex = activeEra.index;
          // let eraRewards = await api.query.staking.erasValidatorReward(currentEraIndex); // we should investigate this one too
          let eraPoints = await api.query.staking.erasRewardPoints(currentEraIndex);
          // retrieve all exposures int the active era
          const exposures = await api.query.staking.erasStakers.entries(currentEraIndex);
          // const endEraValidatorList = await api.query.staking.erasStakers.entries(currentEraIndex + 1) // This returns []

          const endEraValidatorListArrays = exposures.map(([key]) => key = key.args.map((k) => k.toHuman()) // ([key. exposure]) // TODO: REFACTOR
            // console.log('exposure', exposure.toHuman())
            // console.log('key arguments:', key.args.map((k) => k.toHuman()));
            // console.log('     exposure:', exposure.toHuman());
          );
          let endEraValidatorList = []
          endEraValidatorListArrays.forEach(array => {
            endEraValidatorList.push(array[1])
          })
          // console.log('endEraValidatorList', endEraValidatorList) // TODO: maybe include exposure Data. Right now it is just the validators list
          const session_index = await api.query.session.currentIndex();

          return {
            session_index,
            reward_block_id,
            reward: value,
            era_index: currentEraIndex,
            end_era_block_id,
            end_era_block_hash: hash.toString(),
            points: eraPoints,
            elected_validators: endEraValidatorList
          }
        })
      );

      // Fetch commission for current elected validators
      const electedValidatorsInEra = rewards.map(({elected_validators, era_index}) => elected_validators = {
        ...elected_validators,
        era_index
      })

      let allRewards = await Promise.all(
        electedValidatorsInEra.map(async address => {
        const eraIndex = parseInt(address.era_index)
        const validatorAddress = Object.values(address)
        const erasValidatorPrefs = await api.query.staking.erasValidatorPrefs(eraIndex, validatorAddress)
        const commission = erasValidatorPrefs.commission.toNumber() / 10 ** 7;

        let eraRewards = []
        let stakeInfo = {}
        rewards.forEach(reward => {
          let era_points = 0;
          let era_points_percent = 0;
          let total_era_points = reward.points.total.toNumber();
          let index = reward.elected_validators.indexOf(address);

          if (index >= 0) {
            era_points = reward.points; // reward.points.individual[index].toNumber() is now undefined
            era_points_percent = (era_points * 100) / total_era_points;
          }

          let pool_reward_with_commission = ((reward.reward / 100) * era_points_percent) / 10 ** 12;
          let pool_reward = (1 - commission / 100) * pool_reward_with_commission;
          let total_stake = new BigNumber(Number(reward.points.total.toString()) / 10 ** 12);
          // Daily earning logic for frontend
          const stake_amount = new BigNumber(1000);
          const user_stake_fraction = stake_amount.div(total_stake.plus(stake_amount));
          // Per era
          const estimated_payout = user_stake_fraction.multipliedBy(pool_reward_with_commission);

          eraRewards.push({
            reward_session: reward.session_index,
            reward_block_id: reward.reward_block_id,
            reward_amount: reward.reward,
            era_points,
            era_points_percent,
            total_era_points,
            pool_reward_with_commission,
            pool_reward,
            total_stake,
            estimated_payout
          });
          stakeInfo = reward.points
      });

      return {
        stash_id: address,
        commission,
        eraRewards,
        stake_info: stakeInfo
      }
    }))
    
    if (allRewards && allRewards.constructor === Array) {
      allRewards.forEach( async reward => {
        let sqlInsert = `INSERT INTO rewards (block_number, session_index, stash_id, era_rewards, commission, stake_info, timestamp) 
          VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(reward.stash_id)}', '${JSON.stringify(reward.eraRewards.join(''))}', '${reward.commission}', '${JSON.stringify(reward.stake_info)}', extract(epoch from now()));`;
        try {
          console.log('We are going to store to database')
          console.log('POOL', pool)
          const res = await pool.query(sqlInsert);
          console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mResponse from Database is ${JSON.stringify(res)}]`)
        } catch (error) {
          console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mSQL: ${sqlInsert}\x1b[0m`);
          console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
        }
      })
    } else {
      console.log('WHAT HAPPENED')
    }
  }
}