'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

async function normalizeAddress(queryInterface, Sequelize, transaction) {
  const collections = await queryInterface.sequelize.query('select owner from collections where owner_normalized is null limit 1000', {
    type: Sequelize.QueryTypes.SELECT,
    logging: false,
    plain: false,
    transaction,
  });

  if (collections.length === 0) {
    return;
  }

  for (const collection of collections) {
    await queryInterface.sequelize.query(
      `update collections set owner_normalized = :normalizedAddress where owner = :owner`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        logging: false,
        replacements: {
          owner: collection.owner,
          normalizedAddress: normalizeSubstrateAddress(collection.owner),
        },
        transaction,
      },
    );
  }

  await normalizeAddress(queryInterface, Sequelize, transaction);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'collections',
        'owner_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: true,
        },
        {
          transaction,
        },
      );

      await normalizeAddress(queryInterface, Sequelize, transaction);

      await queryInterface.changeColumn(
        'collections',
        'owner_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.addIndex('collections', ['owner_normalized'], {
        name: 'collections_owner_normalized_idx',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('collections', 'owner_normalized');
  }
};
