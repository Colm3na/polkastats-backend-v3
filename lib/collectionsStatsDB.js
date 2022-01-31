const { QueryTypes, Sequelize } = require('sequelize');

const commonQueryOptions = {
  raw: true,
  plain: true,
  logging: false,
};

function getCollectionStatsById(sequelize, collection_id) {
  return sequelize.query(
    `select tokens_count holders_count, actions_count from collections_stats where collection_id = ?;`,{
      type: QueryTypes.SELECT,
      replacements: [collection_id],
      ...commonQueryOptions,
    },
  );
}

function addNewStatsRecord(sequelize, collection_id, statsData) {
  return sequelize.query(
    `insert into collections_stats (
      collection_id,
      tokens_count,
      holders_count,
      actions_count
    )
    values(
      :collection_id,
      :tokens_count,
      :holders_count,
      :actions_count
    );`,
    {
      type: QueryTypes.INSERT,
      replacements: {
        collection_id,
        ...statsData,
      },
      ...commonQueryOptions,
    }
  );
}

function updateStatsRecord(sequelize, collection_id, fieldName, fieldValue) {
  return sequelize.query(
    `update collections_stats set ${fieldName} = :fieldValue where collection_id = :collection_id;`,
    {
      type: QueryTypes.UPDATE,
      replacements: {
        collection_id,
        fieldValue,
      },
      ...commonQueryOptions,
    }
  );
}

async function increaseStatsValue(sequelize, collection_id, fieldName) {
  const collectionStats = await getCollectionStatsById(collection_id);

  if (collectionStats) {
    await updateStatsRecord(
      sequelize,
      collection_id,
      fieldName,
      collectionStats[fieldName] + 1,
    );
  } else {
    await addNewStatsRecord(
      sequelize,
      collection_id,
      {
        tokens_count: fieldName === 'tokens_count' ? 1 : 0,
        holders_count: fieldName === 'holders_count' ? 1 : 0,
        actions_count: fieldName === 'actions_count' ? 1 : 0,
      },
    );
  }

}

async function increaseTokensCount(sequelize, collection_id) {
  await increaseStatsValue(sequelize, collection_id, 'tokens_count');
}

async function increaseHoldersCount(sequelize, collection_id) {
  await increaseStatsValue(sequelize, collection_id, 'holders_count');
}

async function increaseActionsCount(sequelize, collection_id) {
  await increaseStatsValue(sequelize, collection_id, 'actions_count');
}

async function decreaseTokensCount(sequelize, collection_id) {
  await updateStatsRecord(
    sequelize,
    collection_id,
    'tokens_count',
    collectionStats.tokens_count - 1,
  );
}

module.exports = Object.freeze({
  increaseTokensCount,
  increaseHoldersCount,
  increaseActionsCount,
  decreaseTokensCount,
});
