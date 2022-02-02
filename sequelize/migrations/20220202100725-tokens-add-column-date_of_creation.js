'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('tokens', 'date_of_creation', {
      type: Sequelize.DataTypes.BIGINT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('tokens', 'date_of_creation');
  },
};
