'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable("harvester_error", {
       block_number: {
         type: Sequelize.DataTypes.BIGINT,
         allowNull: false,
         primaryKey: true,
       },
       error: {
         type: Sequelize.DataTypes.TEXT,
         allowNull: false,
       },
       timestamp: {
         type: Sequelize.DataTypes.BIGINT,
         allowNull: false,
       },
     });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('harvester_error')
  }
};
