'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable("collections", {
      collection_id: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        unique:true
      },
      owner: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      name: Sequelize.DataTypes.TEXT,
      description: Sequelize.DataTypes.TEXT,
      offchain_schema: Sequelize.DataTypes.TEXT,
      token_limit: { type: Sequelize.DataTypes.BIGINT, allowNull: false }
    });

    await queryInterface.createTable("total", {      
      name: { type: Sequelize.DataTypes.TEXT, allowNull: false, primaryKey: true },
      count: { type: Sequelize.DataTypes.BIGINT, allowNull: false }      
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable("collections");
     await queryInterface.dropTable("total");
  }
};
