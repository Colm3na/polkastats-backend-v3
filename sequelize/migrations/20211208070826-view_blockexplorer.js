'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`create view view_count_event_block as
    select  block_number,
           count(block_number) as count_block_number
    from event
    group by block_number
    order by block_number desc`);

    await queryInterface.sequelize.query(`create view view_count_extrinsic_block as
    select  block_number, count(block_number) as count_extrinsic from extrinsic
    group by block_number
    order by block_number desc`);
  },

  down: async (queryInterface, Sequelize) => {    
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.sequelize.query(`drop view view_count_event_block`);
     
     await queryInterface.sequelize.query(`drop view view_count_extrinsic_block`);
  }
};
