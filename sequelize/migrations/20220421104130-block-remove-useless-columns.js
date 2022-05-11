'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('block', 'current_era');
    await queryInterface.removeColumn('block', 'current_index');
    await queryInterface.removeColumn('block', 'era_length');
    await queryInterface.removeColumn('block', 'era_progress');
    await queryInterface.removeColumn('block', 'is_epoch');
    await queryInterface.removeColumn('block', 'session_per_era');
    await queryInterface.removeColumn('block', 'session_progress');
    await queryInterface.removeColumn('block', 'validator_count');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('block', 'current_era', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'current_index', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'era_length', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'is_epoch', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'session_per_era', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'session_progress', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('block', 'validator_count', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });
  }
};
