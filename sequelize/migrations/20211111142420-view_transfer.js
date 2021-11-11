'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`create view view_transfer as
    with block_numbers as (
        select block_number from event
        where  method = 'Transfer'
        order by timestamp desc limit 300000
    )
    select event.block_number, event.section, event.method, event.data,
           block_hash, parent_hash, extrinsics_root,
           state_root, blocks.timestamp
        from event
        left join block as blocks
            on blocks.block_number = event.block_number
        where
        event.block_number in (select block_number from block_numbers)
        order by blocks.timestamp desc`);
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
