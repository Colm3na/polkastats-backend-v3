'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('account', 'is_staking');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('account', 'is_staking', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false
    });
  },
};
