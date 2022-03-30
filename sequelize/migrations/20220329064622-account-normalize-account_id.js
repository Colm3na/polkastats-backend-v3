'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const accounts = await queryInterface.sequelize.query('select account_id from account', {
        type: Sequelize.QueryTypes.SELECT,
        logging: false,
        transaction,
      });

      for (const account of accounts) {
        await queryInterface.sequelize.query(
          `update account set account_id = :normalizedAddress where account_id = :account_id`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            logging: false,
            replacements: {
              account_id: account.account_id,
              normalizedAddress: normalizeSubstrateAddress(account.account_id),
            },
            transaction,
          });
      }
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => { }
};
