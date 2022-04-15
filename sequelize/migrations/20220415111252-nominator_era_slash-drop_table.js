'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('nominator_era_slash');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.createTable('nominator_era_slash', {
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
  },
};
