'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

async function normalizeAddress(queryInterface, Sequelize, transaction) {
  const accounts = await queryInterface.sequelize.query('select account_id from account where account_id_normalized is null limit 1000', {
    type: Sequelize.QueryTypes.SELECT,
    logging: false,
    plain: false,
    transaction,
  });

  if (accounts.length === 0) {
    return;
  }

  for (const account of accounts) {
    await queryInterface.sequelize.query(
      `update account set account_id_normalized = :normalizedAddress where account_id = :account_id`,
      {
        type: Sequelize.QueryTypes.UPDATE,
        logging: false,
        replacements: {
          account_id: account.account_id,
          normalizedAddress: normalizeSubstrateAddress(account.account_id),
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
        'account',
        'account_id_normalized',
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
        'account',
        'account_id_normalized',
        {
          type: Sequelize.DataTypes.TEXT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.addIndex('account', ['account_id_normalized'], {
        name: 'account_account_id_normalized_idx',
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
    await queryInterface.removeColumn('account', 'account_id_normalized');
  }
};
