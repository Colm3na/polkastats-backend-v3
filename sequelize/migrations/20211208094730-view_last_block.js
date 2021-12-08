'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
      create view view_last_block as select block.block_number,
      vceb.count_block_number as event_count,
      v.count_extrinsic as extrinsic_count,
      block.timestamp
from block
left join view_count_event_block vceb on block.block_number = vceb.block_number
left join view_count_extrinsic_block v on block.block_number = v.block_number
order by block_number desc
    `);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(`
      drop view view_last_block
    `);
  }
};
