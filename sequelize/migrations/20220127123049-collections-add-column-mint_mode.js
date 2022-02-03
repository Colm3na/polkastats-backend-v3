'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('collections', 'mint_mode', {
      type: Sequelize.DataTypes.BOOLEAN,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('collections', 'mint_mode');
  },
};
