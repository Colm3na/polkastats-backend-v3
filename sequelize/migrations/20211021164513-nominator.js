"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("nominator", {
      block_height: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      session_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      account_id: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
      controller_id: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      stash_id: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      rank: { type: Sequelize.DataTypes.INTEGER, allowNull: false },
      total_staked: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      identity: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      display_name: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      balances: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      available_balance: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
      },
      free_balance: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      locked_balance: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      nonce: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      targets: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });

    await queryInterface.createTable("event", {
      block_number: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      event_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      section: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      method: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      phase: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      data: { type: Sequelize.DataTypes.TEXT, allowNull: false },
    });

    await queryInterface.createTable("extrinsic", {
      block_number: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      extrinsic_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      is_signed: { type: Sequelize.DataTypes.BOOLEAN, allowNull: false },
      signer: Sequelize.DataTypes.TEXT,
      section: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      method: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      args: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      hash: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      doc: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      success: { type: Sequelize.DataTypes.BOOLEAN, allowNull: false },
    });

    await queryInterface.createTable("log", {
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

    await queryInterface.createTable("phragmen", {
      block_height: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      phragmen_json: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });

    await queryInterface.createTable("validator_era_staking", {
      era_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      stash_id: Sequelize.DataTypes.TEXT,
      identity: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      display_name: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      commission: Sequelize.DataTypes.BIGINT,
      era_rewards: Sequelize.DataTypes.TEXT,
      era_points: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      stake_info: Sequelize.DataTypes.TEXT,
      estimated_payout: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });

    await queryInterface.createTable("validator_era_slash", {
      era_index: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      stash_id: {
        type: Sequelize.DataTypes.TEXT,
        primaryKey: true
      },
      amount: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
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
    await queryInterface.dropTable("nominator");
    await queryInterface.dropTable("event");
    await queryInterface.dropTable("extrinsic");
    await queryInterface.dropTable("log");
    await queryInterface.dropTable("phragmen");
    await queryInterface.dropTable("validator_era_staking");
    await queryInterface.dropTable("validator_era_slash");
  },
};
