'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('collections', 'date_of_creation', {
      type: Sequelize.DataTypes.BIGINT,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('collections', 'date_of_creation');
  },
};
