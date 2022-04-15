'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('log');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('log', {
      block_number: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      log_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      type: Sequelize.DataTypes.TEXT,
      engine: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      data: { type: Sequelize.DataTypes.TEXT, allowNull: false },
    });
  }
};
