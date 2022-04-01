'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tokens = await queryInterface.sequelize.query('select owner from tokens group by owner', {
        type: Sequelize.QueryTypes.SELECT,
        logging: false,
        transaction,
      });

      for (const token of tokens) {
        await queryInterface.sequelize.query(
          `update tokens set owner = :normalizedAddress where owner = :owner`,
          {
            type: Sequelize.QueryTypes.UPDATE,
            logging: false,
            replacements: {
              owner: token.owner,
              normalizedAddress: normalizeSubstrateAddress(token.owner),
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
