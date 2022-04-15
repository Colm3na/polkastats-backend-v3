'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('phragmen');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('phragmen', {
      block_height: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      phragmen_json: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });
  }
};
