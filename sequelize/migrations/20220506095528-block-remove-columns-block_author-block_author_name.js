'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('block', 'block_author');
    await queryInterface.removeColumn('block', 'block_author_name');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('block', 'block_author', {
      type: Sequelize.DataTypes.TEXT,
    });
    await queryInterface.addColumn('block', 'block_author_name', {
      type: Sequelize.DataTypes.TEXT,
    });
  },
};
