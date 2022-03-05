'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP INDEX IF EXISTS extrinsic_args_idx;');
  },

  down: async (queryInterface, Sequelize) => {}
};
