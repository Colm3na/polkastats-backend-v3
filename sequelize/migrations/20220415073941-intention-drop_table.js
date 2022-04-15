'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('intention');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('intention', {
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
      stakers: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      identity: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      display_name: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      nominators: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      reward_destination: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      staking_ledger: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      staking_ledger_total: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      validator_prefs: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      commission: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      next_session_ids: { type: Sequelize.DataTypes.TEXT, allowNull: false },
      next_session_id_hex: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      next_elected: { type: Sequelize.DataTypes.BOOLEAN, allowNull: false },
      timestamp: { type: Sequelize.DataTypes.BIGINT, allowNull: false },
    });
  }
};
