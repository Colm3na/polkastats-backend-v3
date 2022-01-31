'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('collections_stats', {
      collection_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        unique: true
      },
      tokens_count: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },
      holders_count: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },
      actions_count: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('collections_stats');
  },
};
