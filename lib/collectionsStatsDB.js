const { QueryTypes, Sequelize } = require('sequelize');

const commonQueryOptions = {
  raw: true,
  plain: true,
  logging: false,
};

async function getCollectionStatsById(sequelize, collection_id) {
  const collections = await sequelize.query(
    `select tokens_count holders_count, actions_count from collections_stats where collection_id = ?;`,{
      type: QueryTypes.SELECT,
      replacements: [collection_id],
      ...commonQueryOptions,
    },
  );

  return Array.isArray(collections) && collections.length ? collections[0] : null;
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

async function increaseHoldersCount(sequelize, collection_id, owner) {
  const tokens = await sequelize.query(
    `select token_id from tokens t where collection_id = :collection_id and "owner" != :owner;`, {
      type: QueryTypes.SELECT,
      ...commonQueryOptions,
      replacements: {
        collection_id,
        owner,
      },
  });

  const isHolderExist = Array.isArray(tokens) && tokens.length > 0;

  if (!isHolderExist) {
    await increaseStatsValue(sequelize, collection_id, 'holders_count');
  }
}

async function increaseActionsCount(sequelize, event) {
  const methods = [
    'CollectionCreated',
    'CollectionDestroyed',
    'CollectionSponsorRemoved',
    'CollectionAdminAdded',
    'CollectionOwnedChanged',
    'SponsorshipConfirmed',
    'CollectionAdminRemoved',
    'AllowListAddressRemoved',
    'AllowListAddressAdded',
    'CollectionLimitSet',
    'CollectionSponsorSet',
    'ConstOnChainSchemaSet',
    'MintPermissionSet',
    'OffchainSchemaSet',
    'PublicAccessModeSet',
    'SchemaVersionSet',
    'VariableOnChainSchemaSet',
    'ItemCreated',
    'ItemDestroyed',
  ];

  if (methods.includes(event.method)) {
    const eventData = JSON.parse(event.data);
    const collection_id = eventData[0];

    await increaseStatsValue(sequelize, collection_id, 'actions_count');
  }
}

async function decreaseTokensCount(sequelize, collection_id) {
  const collectionStats = await getCollectionStatsById(collection_id);

  await updateStatsRecord(
    sequelize,
    collection_id,
    'tokens_count',
    collectionStats.tokens_count - 1,
  );
}

async function decreaseHoldersCount(sequelize, collection_id, token_id) {
  const collectionStats = await getCollectionStatsById(collection_id);
  const tokens = await sequelize.query(
    `select token_id from tokens t where collection_id = :collection_id and "owner" in (select "owner" from tokens where token_id = :token_id)`, {
      type: QueryTypes.SELECT,
      ...commonQueryOptions,
      replacements: {
        collection_id,
        token_id,
      },
    },
  );

  // Holder has more than one token.
  const hasAnotherToken = Array.isArray(tokens) && tokens.length > 1;

  if (!hasAnotherToken) {
    await updateStatsRecord(
      sequelize,
      collection_id,
      'holders_count',
      collectionStats.holders_count - 1,
    );
  }
}

module.exports = Object.freeze({
  increaseTokensCount,
  increaseHoldersCount,
  increaseActionsCount,
  decreaseTokensCount,
  decreaseHoldersCount,
});
