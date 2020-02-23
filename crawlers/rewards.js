//
// PolkaStats backend v3
//
// This crawler fetches and stores all validators rewards and slashes events
//
// Usage: node rewards.js
//

// @ts-check
// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');
// Postgres lib
const { Pool } = require('pg');
// Import config params
const {
  wsProviderUrl,
  postgresConnParams
} = require('../backend.config');
const axios = require('axios');
const {BigNumber} = require('bignumber.js');

let currentIndex = 0;
let currentDBIndex = 0;

async function main () {
    
    // Initialise the provider to connect parity kusama wss
    const provider = new WsProvider(wsProviderUrl);

    // Create the API
    const api = await ApiPromise.create({ provider });

    // Wait for API
    await api.isReady;

    // Wait for node is synced
    let node;
    try {
        node = await api.rpc.system.health();
    } catch {
        provider.disconnect();
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mCan't connect to node! Waiting 10s...\x1b[0m`);
        setTimeout(main, 10000);
    }

    if (node.isSyncing.eq(false)) {

        // Node is synced!
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mNode is synced! Starting crawler...\x1b[0m`);

        // Database connection
        const pool = new Pool(postgresConnParams);
        await pool.connect();

        // Subscribe to new blocks
        const unsubscribe = await api.rpc.chain.subscribeNewHeads( async (header) => {

            // Get block number
            const blockNumber = header.number.toNumber();

            // First execution
            if (currentDBIndex === 0) {
                // Get last index stored in DB
                const sqlSelect = `SELECT session_index FROM rewards_info ORDER BY session_index DESC LIMIT 1`;
                const res = await pool.query(sqlSelect);
                if (res.rows.length > 0) {
                currentDBIndex = res.rows[0]["session_index"];
                console.log(`currentDBIndex:`, currentDBIndex);
                console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mLast session index stored in DB is #${currentDBIndex}\x1b[0m`);
                } else {
                console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mNo session index stored in DB!\x1b[0m`);
                }
            }

            // Fetch staking information of elected validators
            const electedInfo = await api.derive.staking.electedInfo();

            // Fetch last reward events from PolkaScan
            const response = await axios.default.get(`https://host-01.polkascan.io/kusama/api/v1/event?&filter[module_id]=staking&filter[event_id]=Reward`);

            const rewardEvents = response.data.data;

            // Fetch rewards event info, retrieve hash, era points and
            // elected validators for all the blocks at the end of the era 
            let rewards = [];
            rewards = await Promise.all(
                rewardEvents.map(async event => {
                    let reward_block_id = event.attributes.block_id;
                    let value = event.attributes.attributes[0].value;
                    let end_era_block_id = event.attributes.block_id - 1;
                    let hash = await api.rpc.chain.getBlockHash(end_era_block_id);
                    let eraPoints = await api.query.staking.currentEraPointsEarned.at(hash.toString());
                    let endEraValidatorList = await api.query.staking.currentElected.at(hash.toString());
                    const session_index = await api.query.session.currentIndex.at(hash);

                    return {
                        session_index,
                        reward_block_id,
                        reward: value,
                        end_era_block_id,
                        end_era_block_hash: hash.toString(),
                        points: eraPoints,
                        elected_validators: endEraValidatorList
                    }
                })
            );

            // Fetch commission for current elected validators
            let allRewards = await Promise.all(
                electedInfo.currentElected.map(async address => {

                const stakeInfo = electedInfo.info
                    .find(
                    val => val.stashId.toString() === address.toString()
                    )        
                const commission = stakeInfo.validatorPrefs.commission.toNumber() / 10 ** 7;

                let eraRewards = []
                rewards.forEach(reward => {
                    let era_points = 0;
                    let era_points_percent = 0;
                    let total_era_points = reward.points.total.toNumber();
                    let index = reward.elected_validators.indexOf(address);

                    if (index >= 0) {
                        era_points = reward.points.individual[index].toNumber() ;
                        era_points_percent = (era_points * 100) / total_era_points;
                    }

                    let pool_reward_with_commission = ((reward.reward / 100) * era_points_percent) / 10 ** 12;
                    let pool_reward = (1 - commission / 100) * pool_reward_with_commission;
                    let total_stake = new BigNumber(Number(stakeInfo.stakers.total) / 10 ** 12);
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

                });

                return {
                    stash_id: address,
                    commission,
                    eraRewards,
                    stake_info: stakeInfo
                }
                
                })
            );

            // Get current session index
            const session = await api.derive.session.info();
            currentIndex = parseInt(session.currentIndex.toString());
            console.log(`[PolkaStats backend v3] - Staking crawler - \x1b[33mCurrent session index is #${currentDBIndex}\x1b[0m`);

            if (currentIndex > currentDBIndex) {
                await storeRewardsInfo(allRewards, blockNumber, currentIndex);

                if (currentDBIndex === 0) {
                    currentDBIndex = currentIndex;
                } else {
                    currentDBIndex++;
                }
            }
        })
    } else {
        provider.disconnect();
        console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mNode is not synced! Waiting 10s...\x1b[0m`);
        setTimeout(main, 10000);
    }
}

async function storeRewardsInfo(allRewards, blockNumber, currentIndex) {

    console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mStoring validators staking info for session #${currentIndex}\x1b[0m`);
  
    // Database connection
    const pool = new Pool(postgresConnParams);
    await pool.connect();

    if (allRewards) {
    // console.log(`allRewards:`, JSON.stringify(allRewards, null, 2));
        allRewards.forEach( async reward => {
            let sqlInsert = `INSERT INTO rewards_info (block_number, session_index, stash_id, era_rewards, commission, stake_info, timestamp) 
                VALUES ('${blockNumber}', '${currentIndex}', '${JSON.stringify(reward.stash_id)}', '${JSON.stringify(reward.eraRewards.join(''))}', '${reward.commission}', '${JSON.stringify(reward.stake_info)}', extract(epoch from now()));`;
            try {
                const res = await pool.query(sqlInsert);
                console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[33mResponse from Database is ${res}]`)
            } catch (error) {
                console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mSQL: ${sqlInsert}\x1b[0m`);
                console.log(`[PolkaStats backend v3] - Rewards crawler - \x1b[31mERROR: ${JSON.stringify(error)}\x1b[0m`);
            }
        })
    }
  
    await pool.end();
}
  
  
main().catch((error) => {
    console.error(error);
    process.exit(-1);
});
