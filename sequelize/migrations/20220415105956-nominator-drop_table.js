'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('nominator');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('nominator', {
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
  },
};
