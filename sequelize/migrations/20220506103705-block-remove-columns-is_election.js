'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('block', 'is_election');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('block', 'is_election', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false
    });
  },
};
