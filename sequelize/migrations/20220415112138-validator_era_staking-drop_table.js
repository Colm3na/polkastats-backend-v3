'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('validator_era_staking');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('validator_era_staking', {
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
  },
};
