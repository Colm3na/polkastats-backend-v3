'use strict';

const { normalizeSubstrateAddress } = require('../../utils/utils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const collections = await queryInterface.sequelize.query('select owner from collections group by owner', {
        type: Sequelize.QueryTypes.SELECT,
        logging: false,
        transaction,
      });

      for (const collection of collections) {
        await queryInterface.sequelize.query(
          `update collections set owner = :normalizedAddress where owner = :owner`,
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
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => { }
};
