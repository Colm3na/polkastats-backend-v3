'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

async function normalizeAddress(queryInterface, Sequelize, transaction) {
  const tokens = await queryInterface.sequelize.query('select owner from tokens where owner_normalized is null limit 1000', {
    type: Sequelize.QueryTypes.SELECT,
    logging: false,
    plain: false,
    transaction,
  });

  if (tokens.length === 0) {
    return;
  }

  for (const token of tokens) {
    await queryInterface.sequelize.query(
      `update tokens set owner_normalized = :normalizedAddress where owner = :owner`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        logging: false,
        replacements: {
          owner: token.owner,
          normalizedAddress: normalizeSubstrateAddress(token.owner),
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
        'tokens',
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
        'tokens',
        'owner_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.addIndex('tokens', ['owner_normalized'], {
        name: 'tokens_owner_normalized_idx',
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
    await queryInterface.removeColumn('tokens', 'owner_normalized');
  }
};
