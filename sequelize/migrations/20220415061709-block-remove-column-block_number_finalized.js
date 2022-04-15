'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.removeColumn('block', 'block_number_finalized');
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.addColumn('block', 'block_number_finalized', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: false,
    });
  },
};
