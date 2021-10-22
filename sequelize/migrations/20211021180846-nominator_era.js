"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("nominator_era_slash", {
      era_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      stash_id: {
        type: Sequelize.DataTypes.TEXT,
        primaryKey: true,
      },
      amount: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });

    await queryInterface.createTable("account", {
      account_id: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
      identity: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      identity_display: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      identity_display_parent: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      balances: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      available_balance: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      free_balance: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      locked_balance: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      nonce: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      block_height: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      is_staking: { type: Sequelize.DataTypes.BOOLEAN, allowNull: false },
    });

    await queryInterface.createTable("system", {
      block_height: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      chain: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      node_name: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      node_version: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });

    await queryInterface.createTable("chain", {
      block_height: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      session_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,        
      },
      total_issuance: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      active_accounts: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });
    
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("nominator_era_slash");
    await queryInterface.dropTable("account");
    await queryInterface.dropTable("system");
    await queryInterface.dropTable("chain");
  },
};
