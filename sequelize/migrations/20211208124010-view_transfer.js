'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.sequelize.query(`drop view view_transfer`);

     await queryInterface.sequelize.query(`
      create view view_transfer as select concat(block_number, '-', event_index) as block_index,
      section,
      method,
      data from event where method = 'Transfer'
     `);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.sequelize.query(`drop view view_transfer`);
  }
};
